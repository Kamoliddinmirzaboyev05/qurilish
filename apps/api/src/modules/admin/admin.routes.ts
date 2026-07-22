import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { adminUserStatusSchema, paginationQuerySchema } from "@buildscience/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok, paginate } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../services/prisma.js";
import { toAuthUser } from "../../utils/serializers.js";
import { toProblemListItem } from "../problems/problems.serializers.js";
import { toProposalListItem } from "../proposals/proposals.serializers.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

function sortOrder(req: { query: Record<string, unknown> }): "asc" | "desc" {
  return req.query.sort === "oldest" ? "asc" : "desc";
}

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Umumiy tizim statistikasi (ADMIN)
 *     responses:
 *       200:
 *         description: OK
 */
adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalCompanies, totalScientists, openProblems, totalProposals, acceptedProposals, blockedUsers] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { role: "COMPANY", deletedAt: null } }),
        prisma.user.count({ where: { role: "SCIENTIST", deletedAt: null } }),
        prisma.problem.count({ where: { status: "OPEN", deletedAt: null } }),
        prisma.proposal.count({ where: { deletedAt: null } }),
        prisma.proposal.count({ where: { status: "ACCEPTED", deletedAt: null } }),
        prisma.user.count({ where: { status: "BLOCKED", deletedAt: null } }),
      ]);

    ok(res, {
      totalUsers,
      totalCompanies,
      totalScientists,
      openProblems,
      totalProposals,
      acceptedProposals,
      blockedUsers,
    });
  })
);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Foydalanuvchilar ro'yxati (ADMIN)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
adminRouter.get(
  "/users",
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { search, page, pageSize } = paginationQuerySchema.parse(req.query);
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && role !== "ALL" ? { role: role as Prisma.EnumRoleFilter["equals"] } : {}),
      ...(status && status !== "ALL" ? { status: status as Prisma.EnumUserStatusFilter["equals"] } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: sortOrder(req) }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.user.count({ where }),
    ]);

    ok(res, paginate(users.map(toAuthUser), page, pageSize, total));
  })
);

/**
 * @openapi
 * /admin/users/{userId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Foydalanuvchi holatini o'zgartirish — ACTIVE/BLOCKED (ADMIN)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, BLOCKED] }
 *     responses:
 *       200:
 *         description: OK
 */
adminRouter.patch(
  "/users/:userId/status",
  validateBody(adminUserStatusSchema),
  asyncHandler(async (req, res) => {
    if (req.params.userId === req.user!.id) {
      throw AppError.badRequest("O'zingizni bloklay olmaysiz.");
    }
    const target = await prisma.user.findFirst({ where: { id: req.params.userId, deletedAt: null } });
    if (!target) throw AppError.notFound("Foydalanuvchi topilmadi.");

    const updated = await prisma.user.update({ where: { id: target.id }, data: { status: req.body.status } });
    ok(res, toAuthUser(updated));
  })
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Foydalanuvchini o'chirish (soft delete, ADMIN)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: O'chirildi
 */
adminRouter.delete(
  "/users/:userId",
  asyncHandler(async (req, res) => {
    if (req.params.userId === req.user!.id) {
      throw AppError.badRequest("O'zingizni o'chira olmaysiz.");
    }
    const target = await prisma.user.findFirst({ where: { id: req.params.userId, deletedAt: null } });
    if (!target) throw AppError.notFound("Foydalanuvchi topilmadi.");

    await prisma.user.update({ where: { id: target.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  })
);

/**
 * @openapi
 * /admin/problems:
 *   get:
 *     tags: [Admin]
 *     summary: Barcha muammolar ro'yxati (ADMIN)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
adminRouter.get(
  "/problems",
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { search, page, pageSize } = paginationQuerySchema.parse(req.query);
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const where: Prisma.ProblemWhereInput = {
      deletedAt: null,
      ...(category && category !== "ALL" ? { category: category as Prisma.EnumCategoryFilter["equals"] } : {}),
      ...(status && status !== "ALL" ? { status: status as Prisma.EnumProblemStatusFilter["equals"] } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        orderBy: { createdAt: sortOrder(req) },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { company: true, _count: { select: { proposals: { where: { deletedAt: null } } } } },
      }),
      prisma.problem.count({ where }),
    ]);

    ok(res, paginate(problems.map((p) => toProblemListItem(p, p._count.proposals)), page, pageSize, total));
  })
);

/**
 * @openapi
 * /admin/problems/{problemId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Muammoni o'chirish (soft delete, ADMIN)
 *     parameters:
 *       - in: path
 *         name: problemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: O'chirildi
 */
adminRouter.delete(
  "/problems/:problemId",
  asyncHandler(async (req, res) => {
    const problem = await prisma.problem.findFirst({ where: { id: req.params.problemId, deletedAt: null } });
    if (!problem) throw AppError.notFound("Muammo topilmadi.");
    await prisma.problem.update({ where: { id: problem.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  })
);

/**
 * @openapi
 * /admin/proposals:
 *   get:
 *     tags: [Admin]
 *     summary: Barcha takliflar ro'yxati (ADMIN)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
adminRouter.get(
  "/proposals",
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { search, page, pageSize } = paginationQuerySchema.parse(req.query);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const where: Prisma.ProposalWhereInput = {
      deletedAt: null,
      ...(status && status !== "ALL" ? { status: status as Prisma.EnumProposalStatusFilter["equals"] } : {}),
      ...(search
        ? {
            OR: [
              { scientist: { name: { contains: search, mode: "insensitive" } } },
              { problem: { title: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: sortOrder(req) },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { scientist: true, problem: { include: { company: true } } },
      }),
      prisma.proposal.count({ where }),
    ]);

    ok(res, paginate(proposals.map(toProposalListItem), page, pageSize, total));
  })
);

/**
 * @openapi
 * /admin/proposals/{proposalId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Taklifni o'chirish (soft delete, ADMIN)
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: O'chirildi
 */
adminRouter.delete(
  "/proposals/:proposalId",
  asyncHandler(async (req, res) => {
    const proposal = await prisma.proposal.findFirst({ where: { id: req.params.proposalId, deletedAt: null } });
    if (!proposal) throw AppError.notFound("Taklif topilmadi.");
    await prisma.proposal.update({ where: { id: proposal.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  })
);
