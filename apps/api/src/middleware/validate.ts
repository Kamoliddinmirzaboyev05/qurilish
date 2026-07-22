import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/AppError.js";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "form";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      return next(AppError.unprocessable("Kiritilgan ma'lumotlarda xatolik bor.", errors));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "form";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      return next(AppError.unprocessable("So'rov parametrlarida xatolik bor.", errors));
    }
    req.query = { ...req.query, ...(result.data as Record<string, unknown>) } as never;
    next();
  };
}
