import type { Proposal, User, Problem } from "@prisma/client";
import type { ProposalListItem } from "@buildscience/shared";

type ProposalWithScientist = Proposal & { scientist: User; problem?: Problem & { company?: User } };

export function toProposalListItem(proposal: ProposalWithScientist): ProposalListItem {
  return {
    id: proposal.id,
    problemId: proposal.problemId,
    scientistId: proposal.scientistId,
    scientistName: proposal.scientist.name,
    specialization: proposal.scientist.specialization,
    organization: proposal.scientist.organization,
    scientistBio: proposal.scientist.bio,
    solutionText: proposal.solutionText,
    estimatedDays: proposal.estimatedDays,
    priceNegotiable: proposal.priceNegotiable,
    proposedPrice: proposal.proposedPrice ? proposal.proposedPrice.toString() : null,
    attachmentOriginalName: proposal.attachmentOriginalName,
    attachmentSize: proposal.attachmentSize,
    status: proposal.status,
    createdAt: proposal.createdAt.toISOString(),
    acceptedAt: proposal.acceptedAt ? proposal.acceptedAt.toISOString() : null,
    ...(proposal.problem
      ? {
          problemTitle: proposal.problem.title,
          problemStatus: proposal.problem.status,
          category: proposal.problem.category,
          companyName: proposal.problem.company?.name,
        }
      : {}),
  };
}
