import { describe, it, expect } from "vitest";
import { registerCompany, registerScientist, createOpenProblem, agent } from "./helpers.js";

async function submitProposal(scientistAgent: ReturnType<typeof agent>, problemId: string, overrides: Record<string, unknown> = {}) {
  return scientistAgent
    .post(`/api/problems/${problemId}/proposals`)
    .field("solutionText", (overrides.solutionText as string) ?? "Ilmiy asoslangan yechim tavsifi. ".repeat(3))
    .field("estimatedDays", String(overrides.estimatedDays ?? 30))
    .field("priceNegotiable", String(overrides.priceNegotiable ?? false))
    .field("proposedPrice", String(overrides.proposedPrice ?? 5000000));
}

describe("proposals", () => {
  it("allows a scientist to submit a proposal", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();

    const res = await submitProposal(scientistAgent, problem.id);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
  });

  it("forbids a company from submitting a proposal", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: otherCompanyAgent } = await registerCompany("other-company@test.local");

    const res = await submitProposal(otherCompanyAgent, problem.id);
    expect(res.status).toBe(403);
  });

  it("prevents a scientist from submitting two proposals to the same problem", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();

    await submitProposal(scientistAgent, problem.id);
    const res = await submitProposal(scientistAgent, problem.id);
    expect(res.status).toBe(409);
  });

  it("rejects proposals to a closed problem", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    await companyAgent.post(`/api/problems/${problem.id}/close`);
    const { agent: scientistAgent } = await registerScientist();

    const res = await submitProposal(scientistAgent, problem.id);
    expect(res.status).toBe(409);
  });

  it("only allows the owning company to list proposals for its problem", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();
    await submitProposal(scientistAgent, problem.id);

    const { agent: otherCompanyAgent } = await registerCompany("intruder@test.local");
    const res = await otherCompanyAgent.get(`/api/problems/${problem.id}/proposals`);
    expect(res.status).toBe(403);
  });

  it("prevents a scientist from viewing another scientist's proposal", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();
    const created = await submitProposal(scientistAgent, problem.id);

    const { agent: otherScientistAgent } = await registerScientist("other-scientist@test.local");
    const res = await otherScientistAgent.get(`/api/proposals/${created.body.data.id}`);
    expect(res.status).toBe(403);
  });

  it("hides scientist contact info from company before acceptance", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();
    await submitProposal(scientistAgent, problem.id);

    const res = await companyAgent.get(`/api/problems/${problem.id}/proposals`);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("scientist@test.local");
    expect(body).not.toContain("+998907654321");
  });
});
