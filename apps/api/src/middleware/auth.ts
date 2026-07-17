import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.session.userId;
  if (!userId) throw AppError.unauthorized();

  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) {
    req.session.userId = undefined;
    throw AppError.unauthorized();
  }
  if (user.status === "BLOCKED") {
    req.session.userId = undefined;
    throw new AppError(403, "Ushbu foydalanuvchi bloklangan. Administrator bilan bog'laning.");
  }

  req.user = user;
  next();
});

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}
