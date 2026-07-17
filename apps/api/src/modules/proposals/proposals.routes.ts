import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { createProposalSchema, updateProposalSchema } from "@buildscience/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { handleProposalUpload, uploadRoot } from "../../middleware/upload.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../services/prisma.js";
import { toProposalListItem } from "./proposals.serializers.js";

export const proposalsRouter = Router();

proposalsRouter.get(
  "/company/proposals/recent",
  requireAuth,
  requireRole("COMPANY"),
  asyncHandler(async (req, res) => {
    const proposals = await prisma.proposal.findMany({
      where: { deletedAt: null, problem: { companyId: req.user!.id, deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { scientist: true, problem: { include: { company: true } } },
    });
    ok(res, { items: proposals.map(toProposalListItem) });
  })
);

function parseProposalBody(body: Record<string, unknown>) {
  const result = createProposalSchema.safeParse({
    solutionText: body.solutionText,
    estimatedDays: body.estimatedDays,
    priceNegotiable: body.priceNegotiable === "true" || body.priceNegotiable === true,
    proposedPrice: body.proposedPrice === "" || body.proposedPrice == null ? null : body.proposedPrice,
  });
  return result;
}

async function removeFileSafely(storedName: string | null) {
  if (!storedName) return;
  const filePath = path.join(uploadRoot, storedName);
  try {
    await fs.unlink(filePath);
  } catch {
    // ponytail: best-effort cleanup, file may already be gone
  }
}

proposalsRouter.post(
  "/problems/:problemId/proposals",
  requireAuth,
  requireRole("SCIENTIST"),
  handleProposalUpload,
  asyncHandler(async (req, res) => {
    const parsed = parseProposalBody(req.body);
    if (!parsed.success) {
      await removeFileSafely(req.file?.filename ?? null);
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      throw AppError.unprocessable("Kiritilgan ma'lumotlarda xatolik bor.", errors);
    }

    const problem = await prisma.problem.findFirst({ where: { id: req.params.problemId, deletedAt: null } });
    if (!problem) {
      await removeFileSafely(req.file?.filename ?? null);
      throw AppError.notFound("Muammo topilmadi.");
    }
    if (problem.status !== "OPEN") {
      await removeFileSafely(req.file?.filename ?? null);
      throw AppError.conflict("Bu muammoga taklif yuborib bo'lmaydi.");
    }

    const existing = await prisma.proposal.findFirst({
      where: { problemId: problem.id, scientistId: req.user!.id, deletedAt: null },
    });
    if (existing) {
      await removeFileSafely(req.file?.filename ?? null);
      throw AppError.conflict("Siz bu muammoga allaqachon taklif yuborgansiz.");
    }

    const proposal = await prisma.proposal.create({
      data: {
        problemId: problem.id,
        scientistId: req.user!.id,
        solutionText: parsed.data.solutionText,
        estimatedDays: parsed.data.estimatedDays,
        priceNegotiable: parsed.data.priceNegotiable,
        proposedPrice: parsed.data.proposedPrice ?? null,
        attachmentOriginalName: req.file?.originalname ?? null,
        attachmentStoredName: req.file?.filename ?? null,
        attachmentMime: req.file?.mimetype ?? null,
        attachmentSize: req.file?.size ?? null,
        status: "PENDING",
      },
      include: { scientist: true },
    });

    ok(res, toProposalListItem(proposal), 201);
  })
);

proposalsRouter.get(
  "/problems/:problemId/proposals",
  requireAuth,
  asyncHandler(async (req, res) => {
    const problem = await prisma.problem.findFirst({ where: { id: req.params.problemId, deletedAt: null } });
    if (!problem) throw AppError.notFound("Muammo topilmadi.");
    if (req.user!.role !== "ADMIN" && problem.companyId !== req.user!.id) {
      throw AppError.forbidden();
    }

    const proposals = await prisma.proposal.findMany({
      where: { problemId: problem.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { scientist: true },
    });

    ok(res, { items: proposals.map(toProposalListItem) });
  })
);

proposalsRouter.get(
  "/proposals/mine",
  requireAuth,
  requireRole("SCIENTIST"),
  asyncHandler(async (req, res) => {
    const proposals = await prisma.proposal.findMany({
      where: { scientistId: req.user!.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { scientist: true, problem: { include: { company: true } } },
    });
    ok(res, { items: proposals.map(toProposalListItem) });
  })
);

async function loadProposalWithAccess(proposalId: string, userId: string, role: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, deletedAt: null },
    include: { scientist: true, problem: { include: { company: true } } },
  });
  if (!proposal) throw AppError.notFound("Taklif topilmadi.");

  const isOwnerScientist = proposal.scientistId === userId;
  const isOwnerCompany = proposal.problem?.companyId === userId;
  const isAdmin = role === "ADMIN";
  if (!isOwnerScientist && !isOwnerCompany && !isAdmin) throw AppError.forbidden();

  return proposal;
}

proposalsRouter.get(
  "/proposals/:proposalId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const proposal = await loadProposalWithAccess(req.params.proposalId!, req.user!.id, req.user!.role);
    ok(res, toProposalListItem(proposal));
  })
);

proposalsRouter.patch(
  "/proposals/:proposalId",
  requireAuth,
  requireRole("SCIENTIST"),
  handleProposalUpload,
  asyncHandler(async (req, res) => {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.proposalId, deletedAt: null },
      include: { problem: true },
    });
    if (!proposal) {
      await removeFileSafely(req.file?.filename ?? null);
      throw AppError.notFound("Taklif topilmadi.");
    }
    if (proposal.scientistId !== req.user!.id) {
      await removeFileSafely(req.file?.filename ?? null);
      throw AppError.forbidden();
    }
    if (proposal.status !== "PENDING" || proposal.problem?.status !== "OPEN") {
      await removeFileSafely(req.file?.filename ?? null);
      throw AppError.conflict("Faqat kutilayotgan va ochiq muammo bo'yicha taklifni tahrirlash mumkin.");
    }

    const parsed = updateProposalSchema.safeParse({
      solutionText: req.body.solutionText,
      estimatedDays: req.body.estimatedDays,
      priceNegotiable: req.body.priceNegotiable === "true" || req.body.priceNegotiable === true,
      proposedPrice: req.body.proposedPrice === "" || req.body.proposedPrice == null ? null : req.body.proposedPrice,
    });
    if (!parsed.success) {
      await removeFileSafely(req.file?.filename ?? null);
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      throw AppError.unprocessable("Kiritilgan ma'lumotlarda xatolik bor.", errors);
    }

    const oldStoredName = proposal.attachmentStoredName;
    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        solutionText: parsed.data.solutionText,
        estimatedDays: parsed.data.estimatedDays,
        priceNegotiable: parsed.data.priceNegotiable,
        proposedPrice: parsed.data.proposedPrice ?? null,
        ...(req.file
          ? {
              attachmentOriginalName: req.file.originalname,
              attachmentStoredName: req.file.filename,
              attachmentMime: req.file.mimetype,
              attachmentSize: req.file.size,
            }
          : {}),
      },
      include: { scientist: true },
    });

    if (req.file && oldStoredName) {
      await removeFileSafely(oldStoredName);
    }

    ok(res, toProposalListItem(updated));
  })
);

proposalsRouter.post(
  "/proposals/:proposalId/withdraw",
  requireAuth,
  requireRole("SCIENTIST"),
  asyncHandler(async (req, res) => {
    const proposal = await prisma.proposal.findFirst({ where: { id: req.params.proposalId, deletedAt: null } });
    if (!proposal) throw AppError.notFound("Taklif topilmadi.");
    if (proposal.scientistId !== req.user!.id) throw AppError.forbidden();
    if (proposal.status !== "PENDING") throw AppError.conflict("Faqat kutilayotgan taklifni bekor qilish mumkin.");

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "WITHDRAWN", withdrawnAt: new Date() },
      include: { scientist: true },
    });
    ok(res, toProposalListItem(updated));
  })
);

proposalsRouter.post(
  "/proposals/:proposalId/accept",
  requireAuth,
  requireRole("COMPANY"),
  asyncHandler(async (req, res) => {
    const proposalId = req.params.proposalId;

    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.findFirst({ where: { id: proposalId, deletedAt: null } });
      if (!proposal) throw AppError.notFound("Taklif topilmadi.");

      const problem = await tx.problem.findFirst({ where: { id: proposal.problemId, deletedAt: null } });
      if (!problem) throw AppError.notFound("Muammo topilmadi.");
      if (problem.companyId !== req.user!.id) throw AppError.forbidden();
      if (proposal.status !== "PENDING") throw AppError.conflict("Taklif allaqachon ko'rib chiqilgan.");

      const scientist = await tx.user.findFirst({
        where: { id: proposal.scientistId, status: "ACTIVE", deletedAt: null },
      });
      if (!scientist) throw AppError.conflict("Olim faol emas.");

      const claim = await tx.problem.updateMany({
        where: { id: problem.id, status: "OPEN" },
        data: { status: "MATCHED", matchedAt: new Date() },
      });
      if (claim.count === 0) {
        throw AppError.conflict("Muammo allaqachon boshqa taklif bilan yopilgan.");
      }

      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      await tx.proposal.updateMany({
        where: { problemId: problem.id, status: "PENDING", id: { not: proposal.id } },
        data: { status: "REJECTED" },
      });

      return tx.proposal.findFirstOrThrow({ where: { id: proposal.id }, include: { scientist: true } });
    });

    ok(res, toProposalListItem(result));
  })
);

proposalsRouter.get(
  "/proposals/:proposalId/attachment",
  requireAuth,
  asyncHandler(async (req, res) => {
    const proposal = await loadProposalWithAccess(req.params.proposalId!, req.user!.id, req.user!.role);
    if (!proposal.attachmentStoredName || !proposal.attachmentOriginalName) {
      throw AppError.notFound("Fayl mavjud emas.");
    }

    const filePath = path.join(uploadRoot, proposal.attachmentStoredName);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadRoot))) {
      throw AppError.badRequest("Noto'g'ri fayl so'rovi.");
    }

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(proposal.attachmentOriginalName)}"`);
    if (proposal.attachmentMime) res.setHeader("Content-Type", proposal.attachmentMime);
    res.sendFile(resolved, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ success: false, message: "Fayl topilmadi." });
      }
    });
  })
);
