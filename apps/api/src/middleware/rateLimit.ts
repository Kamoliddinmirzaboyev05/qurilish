import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { success: false, message: "Urinishlar soni ko'p. Birozdan so'ng qayta urinib ko'ring." },
});
