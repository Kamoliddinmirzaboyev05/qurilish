import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { createProblemSchema, updateProblemSchema, problemQuerySchema, paginationQuerySchema, type CompanyStats } from "@buildscience/shared";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok, paginate } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../services/prisma.js";
import { toProblemDetail, toProblemListItem } from "./problems.serializers.js";

export const problemsRouter = Router();

problemsRouter.get(
  "/problems",
  validateQuery(problemQuerySchema),
  asyncHandler(async (req, res) => {
    const { search, category, budgetType, sort, page, pageSize } = problemQuerySchema.parse(req.query);

    const where: Prisma.ProblemWhereInput = {
      status: "OPEN",
      deletedAt: null,
      ...(category ? { category: category as Prisma.EnumCategoryFilter["equals"] } : {}),
      ...(budgetType ? { budgetType: budgetType as Prisma.EnumBudgetTypeFilter["equals"] } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProblemOrderByWithRelationInput =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "budgetHigh"
          ? { budgetAmount: { sort: "desc", nulls: "last" } }
          : sort === "budgetLow"
            ? { budgetAmount: { sort: "asc", nulls: "last" } }
            : { createdAt: "desc" };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { company: true, _count: { select: { proposals: { where: { deletedAt: null } } } } },
      }),
      prisma.problem.count({ where }),
    ]);

    const items = problems.map((p) => toProblemListItem(p, p._count.proposals));
    ok(res, paginate(items, page, pageSize, total));
  })
);

problemsRouter.get(
  "/company/problems",
  requireAuth,
  requireRole("COMPANY"),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const where: Prisma.ProblemWhereInput = {
      companyId: req.user!.id,
      deletedAt: null,
      ...(status && status !== "ALL" ? { status: status as Prisma.EnumProblemStatusFilter["equals"] } : {}),
    };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { company: true, _count: { select: { proposals: { where: { deletedAt: null } } } } },
      }),
      prisma.problem.count({ where }),
    ]);

    const items = problems.map((p) => toProblemListItem(p, p._count.proposals));
    ok(res, paginate(items, page, pageSize, total));
  })
);

problemsRouter.get(
  "/company/stats",
  requireAuth,
  requireRole("COMPANY"),
  asyncHandler(async (req, res) => {
    const companyId = req.user!.id;
    const [openProblems, matchedProblems, closedProblems, totalProposals] = await Promise.all([
      prisma.problem.count({ where: { companyId, deletedAt: null, status: "OPEN" } }),
      prisma.problem.count({ where: { companyId, deletedAt: null, status: "MATCHED" } }),
      prisma.problem.count({ where: { companyId, deletedAt: null, status: "CLOSED" } }),
      prisma.proposal.count({ where: { deletedAt: null, problem: { companyId, deletedAt: null } } }),
    ]);
    const stats: CompanyStats = { openProblems, matchedProblems, closedProblems, totalProposals };
    ok(res, stats);
  })
);

async function loadVisibleProblem(problemId: string, userId?: string, userRole?: string) {
  const problem = await prisma.problem.findFirst({
    where: { id: problemId, deletedAt: null },
    include: { company: true, _count: { select: { proposals: { where: { deletedAt: null } } } } },
  });
  if (!problem) throw AppError.notFound("Muammo topilmadi.");

  if (problem.status === "OPEN") return problem;

  const isOwner = userId === problem.companyId;
  const isAdmin = userRole === "ADMIN";
  if (isOwner || isAdmin) return problem;

  if (userId) {
    const hasProposal = await prisma.proposal.findFirst({ where: { problemId, scientistId: userId, deletedAt: null } });
    if (hasProposal) return problem;
  }

  throw AppError.notFound("Muammo topilmadi.");
}

problemsRouter.get(
  "/problems/:problemId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const problem = await loadVisibleProblem(req.params.problemId!, req.user?.id, req.user?.role);
    ok(res, toProblemDetail(problem, problem._count.proposals));
  })
);

problemsRouter.post(
  "/problems",
  requireAuth,
  requireRole("COMPANY"),
  validateBody(createProblemSchema),
  asyncHandler(async (req, res) => {
    const problem = await prisma.problem.create({
      data: {
        companyId: req.user!.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        budgetType: req.body.budgetType,
        budgetAmount: req.body.budgetAmount ?? null,
        status: "OPEN",
      },
      include: { company: true, _count: { select: { proposals: true } } },
    });
    ok(res, toProblemDetail(problem, problem._count.proposals), 201);
  })
);

async function loadOwnedOpenProblem(problemId: string, companyId: string) {
  const problem = await prisma.problem.findFirst({ where: { id: problemId, deletedAt: null } });
  if (!problem) throw AppError.notFound("Muammo topilmadi.");
  if (problem.companyId !== companyId) throw AppError.forbidden();
  return problem;
}

problemsRouter.patch(
  "/problems/:problemId",
  requireAuth,
  requireRole("COMPANY"),
  validateBody(updateProblemSchema),
  asyncHandler(async (req, res) => {
    const existing = await loadOwnedOpenProblem(req.params.problemId!, req.user!.id);
    if (existing.status !== "OPEN") {
      throw AppError.conflict("Faqat ochiq muammoni tahrirlash mumkin.");
    }
    const updated = await prisma.problem.update({
      where: { id: existing.id },
      data: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        budgetType: req.body.budgetType,
        budgetAmount: req.body.budgetAmount ?? null,
      },
      include: { company: true, _count: { select: { proposals: true } } },
    });
    ok(res, toProblemDetail(updated, updated._count.proposals));
  })
);

problemsRouter.delete(
  "/problems/:problemId",
  requireAuth,
  requireRole("COMPANY"),
  asyncHandler(async (req, res) => {
    const existing = await loadOwnedOpenProblem(req.params.problemId!, req.user!.id);
    const proposalCount = await prisma.proposal.count({ where: { problemId: existing.id, deletedAt: null } });
    if (proposalCount > 0) {
      throw AppError.conflict("Takliflari mavjud muammoni o'chirib bo'lmaydi.");
    }
    await prisma.problem.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  })
);

problemsRouter.post(
  "/problems/:problemId/close",
  requireAuth,
  requireRole("COMPANY"),
  asyncHandler(async (req, res) => {
    const existing = await loadOwnedOpenProblem(req.params.problemId!, req.user!.id);
    if (existing.status !== "OPEN") {
      throw AppError.conflict("Faqat ochiq muammoni yopish mumkin.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.proposal.updateMany({
        where: { problemId: existing.id, status: "PENDING" },
        data: { status: "REJECTED" },
      });
      return tx.problem.update({
        where: { id: existing.id },
        data: { status: "CLOSED", closedAt: new Date() },
        include: { company: true, _count: { select: { proposals: true } } },
      });
    });

    ok(res, toProblemDetail(updated, updated._count.proposals));
  })
);
