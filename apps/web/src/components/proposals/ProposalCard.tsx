import { Paperclip } from "lucide-react";
import type { ProposalListItem } from "@buildscience/shared";
import { Card } from "@/components/ui/Card";
import { ProposalStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/format";
import { API_BASE } from "@/lib/api";

export function ProposalCard({
  proposal,
  showScientist,
  showProblem,
  footer,
}: {
  proposal: ProposalListItem;
  showScientist?: boolean;
  showProblem?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          {showProblem && proposal.problemTitle && (
            <p className="text-sm font-medium text-brand-primary">{proposal.problemTitle}</p>
          )}
          {showScientist && (
            <p className="text-base font-semibold text-brand-dark">{proposal.scientistName}</p>
          )}
          {showScientist && (proposal.specialization || proposal.organization) && (
            <p className="text-sm text-ink-muted">
              {[proposal.specialization, proposal.organization].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <ProposalStatusBadge status={proposal.status} />
      </div>

      <p className="text-sm text-ink">{proposal.solutionText}</p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
        <span className="font-medium text-brand-dark">
          {proposal.priceNegotiable ? "Kelishiladi" : formatMoney(proposal.proposedPrice)}
        </span>
        <span>{proposal.estimatedDays} kun</span>
        <span>{formatDate(proposal.createdAt)}</span>
        {proposal.attachmentOriginalName && (
          <a
            href={`${API_BASE}/proposals/${proposal.id}/attachment`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-brand-primary hover:text-brand-primaryHover"
          >
            <Paperclip size={14} /> {proposal.attachmentOriginalName}
          </a>
        )}
      </div>

      {footer}
    </Card>
  );
}
