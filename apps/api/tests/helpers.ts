import request from "supertest";
import { app } from "../src/app.js";

export function agent() {
  return request.agent(app);
}

export async function registerCompany(email = "company@test.local") {
  const a = agent();
  const res = await a.post("/api/auth/register").send({
    role: "COMPANY",
    name: "Test Qurilish MChJ",
    email,
    phone: "+998901234567",
    password: "Password123",
    passwordConfirm: "Password123",
  });
  return { agent: a, res };
}

export async function registerScientist(email = "scientist@test.local") {
  const a = agent();
  const res = await a.post("/api/auth/register").send({
    role: "SCIENTIST",
    name: "Test Olim",
    email,
    phone: "+998907654321",
    password: "Password123",
    passwordConfirm: "Password123",
    specialization: "Beton",
    organization: "Test Universitet",
  });
  return { agent: a, res };
}

export async function createOpenProblem(companyAgent: ReturnType<typeof agent>) {
  const res = await companyAgent.post("/api/problems").send({
    title: "Beton mustahkamligini oshirish bo'yicha ilmiy yechim kerak",
    description: "Beton mustahkamligini oshirish uchun ilmiy asoslangan yechim izlaymiz. ".repeat(3),
    category: "CONCRETE_CEMENT",
    budgetType: "FIXED",
    budgetAmount: 1000000,
  });
  return res.body.data;
}
