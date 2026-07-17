import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { env } from "../config/env.js";
import { UPLOAD } from "@buildscience/shared";
import { AppError } from "../utils/AppError.js";

export const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(24).toString("hex");
    cb(null, `${randomName}${ext}`);
  },
});

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = (UPLOAD.ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype);
  const extOk = (UPLOAD.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  if (!mimeOk || !extOk) {
    cb(new Error("INVALID_FILE_TYPE"));
    return;
  }
  cb(null, true);
}

const uploadProposalAttachment = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
}).single("attachment");

export function handleProposalUpload(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  uploadProposalAttachment(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(AppError.badRequest("Fayl hajmi 10 MB dan oshmasligi kerak."));
      }
      if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
        return next(AppError.badRequest("Faqat PDF, JPG va PNG fayllarini yuklash mumkin."));
      }
      return next(err);
    }
    next();
  });
}
