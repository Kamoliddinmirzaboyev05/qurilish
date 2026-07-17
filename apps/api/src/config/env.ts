const REQUIRED = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "WEB_ORIGIN",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_NAME",
  "ADMIN_PHONE",
] as const;

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  sessionSecret: process.env.SESSION_SECRET as string,
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "bs_session",
  webOrigin: process.env.WEB_ORIGIN as string,
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 10),
  admin: {
    name: process.env.ADMIN_NAME as string,
    email: (process.env.ADMIN_EMAIL as string).toLowerCase(),
    phone: process.env.ADMIN_PHONE as string,
    password: process.env.ADMIN_PASSWORD as string,
  },
};
