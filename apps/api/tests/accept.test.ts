import { describe, it, expect } from "vitest";
import { registerCompany, registerScientist, createOpenProblem, agent } from "./helpers.js";

async function submitProposal(scientistAgent: ReturnType<typeof agent>, problemId: string, price = 5000000) {
  return scientistAgent
    .post(`/api/problems/${problemId}/proposals`)
    .field("solutionText", "Ilmiy asoslangan yechim tavsifi. ".repeat(3))
    .field("estimatedDays", "30")
    .field("priceNegotiable", "false")
    .field("proposedPrice", String(price));
}

describe("proposal acceptance", () => {
  it("accepts one proposal, rejects the rest, matches the problem", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: s1 } = await registerScientist("s1@test.local");
    const { agent: s2 } = await registerScientist("s2@test.local");

    const p1 = await submitProposal(s1, problem.id);
    const p2 = await submitProposal(s2, problem.id);

    const acceptRes = await companyAgent.post(`/api/proposals/${p1.body.data.id}/accept`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe("ACCEPTED");

    const problemRes = await companyAgent.get(`/api/problems/${problem.id}`);
    expect(problemRes.body.data.status).toBe("MATCHED");

    const rejectedRes = await companyAgent.get(`/api/proposals/${p2.body.data.id}`);
    expect(rejectedRes.body.data.status).toBe("REJECTED");
  });

  it("cannot accept two proposals for the same problem (atomic guard)", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: s1 } = await registerScientist("race1@test.local");
    const { agent: s2 } = await registerScientist("race2@test.local");

    const p1 = await submitProposal(s1, problem.id);
    const p2 = await submitProposal(s2, problem.id);

    const [r1, r2] = await Promise.all([
      companyAgent.post(`/api/proposals/${p1.body.data.id}/accept`),
      companyAgent.post(`/api/proposals/${p2.body.data.id}/accept`),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it("reveals contacts to both parties only after acceptance", async () => {
    const { agent: companyAgent, res: companyRes } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();
    const proposal = await submitProposal(scientistAgent, problem.id);

    await companyAgent.post(`/api/proposals/${proposal.body.data.id}/accept`);

    const companyConnections = await companyAgent.get("/api/connections");
    expect(companyConnections.body.data.items[0].scientistEmail).toBe("scientist@test.local");

    const scientistConnections = await scientistAgent.get("/api/connections");
    expect(scientistConnections.body.data.items[0].companyEmail).toBe(companyRes.body.data.email);
  });

  it("never reveals contacts to a rejected scientist", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: winner } = await registerScientist("winner@test.local");
    const { agent: loser } = await registerScientist("loser@test.local");

    const winnerProposal = await submitProposal(winner, problem.id);
    await submitProposal(loser, problem.id);
    await companyAgent.post(`/api/proposals/${winnerProposal.body.data.id}/accept`);

    const loserConnections = await loser.get("/api/connections");
    expect(loserConnections.body.data.items).toHaveLength(0);
  });

  it("closing a problem rejects all pending proposals", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();
    const proposal = await submitProposal(scientistAgent, problem.id);

    await companyAgent.post(`/api/problems/${problem.id}/close`);

    const res = await scientistAgent.get(`/api/proposals/${proposal.body.data.id}`);
    expect(res.body.data.status).toBe("REJECTED");
  });
});
