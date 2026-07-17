import { describe, it, expect } from "vitest";
import { registerCompany, registerScientist, createOpenProblem } from "./helpers.js";

describe("problems", () => {
  it("allows a company to create a problem", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    expect(problem.status).toBe("OPEN");
  });

  it("forbids a scientist from creating a problem", async () => {
    const { agent: scientistAgent } = await registerScientist();
    const res = await scientistAgent.post("/api/problems").send({
      title: "Scientist trying to create a problem here",
      description: "x".repeat(60),
      category: "OTHER",
      budgetType: "NEGOTIABLE",
    });
    expect(res.status).toBe(403);
  });

  it("lists only OPEN problems publicly", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    await companyAgent.post(`/api/problems/${problem.id}/close`);

    const res = await registerScientist().then(({ agent: a }) => a.get("/api/problems"));
    expect(res.status).toBe(200);
    expect(res.body.data.items.find((p: { id: string }) => p.id === problem.id)).toBeUndefined();
  });
});
