import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.test");
const result = config({ path: envPath, override: true });

if (result.error) {
  console.error(
    `Missing apps/api/.env.test — copy apps/api/.env.test.example to apps/api/.env.test first.`
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL?.includes("_test")) {
  console.error("Refusing to migrate: DATABASE_URL in .env.test does not look like a test database.");
  process.exit(1);
}

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: process.env,
});
