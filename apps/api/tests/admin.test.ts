import { describe, it, expect } from "vitest";
import { registerCompany, agent } from "./helpers.js";
import { prisma } from "../src/services/prisma.js";
import { hashPassword } from "../src/utils/password.js";

async function adminAgent() {
  await prisma.user.create({
    data: {
      role: "ADMIN",
      name: "Test Admin",
      email: "admin@test.local",
      phone: "+998900000000",
      passwordHash: await hashPassword("AdminPass123"),
      status: "ACTIVE",
    },
  });
  const a = agent();
  await a.post("/api/auth/login").send({ email: "admin@test.local", password: "AdminPass123" });
  return a;
}

describe("admin moderation", () => {
  it("can block a user", async () => {
    const admin = await adminAgent();
    const { res } = await registerCompany();
    const userId = res.body.data.id;

    const blockRes = await admin.patch(`/api/admin/users/${userId}/status`).send({ status: "BLOCKED" });
    expect(blockRes.status).toBe(200);
    expect(blockRes.body.data.status).toBe("BLOCKED");
  });

  it("can soft-delete a spam problem, hiding it from public listing", async () => {
    const admin = await adminAgent();
    const { agent: companyAgent } = await registerCompany();
    const problemRes = await companyAgent.post("/api/problems").send({
      title: "Spam e'lon sarlavhasi shu yerda",
      description: "Spam tavsif matni ".repeat(10),
      category: "OTHER",
      budgetType: "NEGOTIABLE",
    });
    const problemId = problemRes.body.data.id;

    const deleteRes = await admin.delete(`/api/admin/problems/${problemId}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await companyAgent.get("/api/problems");
    expect(listRes.body.data.items.find((p: { id: string }) => p.id === problemId)).toBeUndefined();
  });

  it("cannot block itself", async () => {
    const admin = await adminAgent();
    const me = await admin.get("/api/auth/me");
    const res = await admin.patch(`/api/admin/users/${me.body.data.id}/status`).send({ status: "BLOCKED" });
    expect(res.status).toBe(400);
  });
});
