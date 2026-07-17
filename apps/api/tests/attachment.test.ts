import { describe, it, expect } from "vitest";
import { registerCompany, registerScientist, createOpenProblem } from "./helpers.js";

describe("proposal attachment", () => {
  it("allows the submitting scientist and owning company to download; blocks strangers", async () => {
    const { agent: companyAgent } = await registerCompany();
    const problem = await createOpenProblem(companyAgent);
    const { agent: scientistAgent } = await registerScientist();

    const proposal = await scientistAgent
      .post(`/api/problems/${problem.id}/proposals`)
      .field("solutionText", "Ilmiy asoslangan yechim tavsifi. ".repeat(3))
      .field("estimatedDays", "30")
      .field("priceNegotiable", "false")
      .field("proposedPrice", "5000000")
      .attach("attachment", Buffer.from("%PDF-1.4 test"), { filename: "hujjat.pdf", contentType: "application/pdf" });

    const proposalId = proposal.body.data.id;

    const ownerDownload = await scientistAgent.get(`/api/proposals/${proposalId}/attachment`);
    expect(ownerDownload.status).toBe(200);

    const companyDownload = await companyAgent.get(`/api/proposals/${proposalId}/attachment`);
    expect(companyDownload.status).toBe(200);

    const { agent: strangerAgent } = await registerScientist("stranger@test.local");
    const strangerDownload = await strangerAgent.get(`/api/proposals/${proposalId}/attachment`);
    expect(strangerDownload.status).toBe(403);
  });
});
