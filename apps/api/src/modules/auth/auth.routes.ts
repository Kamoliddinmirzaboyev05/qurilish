import { Router } from "express";
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "@buildscience/shared";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import { toAuthUser } from "../../utils/serializers.js";
import { registerUser, authenticateUser } from "./auth.service.js";
import { prisma } from "../../services/prisma.js";
import { verifyPassword, hashPassword } from "../../utils/password.js";
import { normalizePhone } from "../../utils/phone.js";
import { AppError } from "../../utils/AppError.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    req.session.userId = user.id;
    ok(res, toAuthUser(user), 201);
  })
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await authenticateUser(req.body.email, req.body.password);
    req.session.userId = user.id;
    ok(res, toAuthUser(user));
  })
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(process.env.SESSION_COOKIE_NAME ?? "bs_session");
    ok(res, { loggedOut: true });
  });
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, toAuthUser(req.user!));
  })
);

authRouter.patch(
  "/profile",
  requireAuth,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: req.body.name,
        phone: normalizePhone(req.body.phone),
        organization: req.body.organization || null,
        specialization: req.body.specialization || null,
        bio: req.body.bio || null,
      },
    });
    ok(res, toAuthUser(updated));
  })
);

authRouter.patch(
  "/password",
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const valid = await verifyPassword(req.body.currentPassword, req.user!.passwordHash);
    if (!valid) throw AppError.badRequest("Joriy parol noto'g'ri.", { currentPassword: ["Joriy parol noto'g'ri."] });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: await hashPassword(req.body.newPassword) },
    });
    ok(res, { updated: true });
  })
);
