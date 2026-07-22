import { Link } from "react-router-dom";
import { useExpertProposals } from "@/features/proposals/hooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, EmptyState, CardGridSkeleton } from "@/components/ui/Card";
import { ProposalStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/format";

export default function ExpertDashboardPage() {
  const { data, isLoading } = useExpertProposals();
  const proposals = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ekspertiza paneli"
        subtitle={`${proposals.length} ta taklif ekspertiza kutmoqda`}
      />

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : proposals.length === 0 ? (
        <EmptyState title="Hozircha baholash uchun takliflar yo'q." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="flex flex-col justify-between gap-4">
              <div>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-brand-dark line-clamp-2">
                    {proposal.problemTitle ?? "Noma'lum muammo"}
                  </h3>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <p className="mb-3 text-sm text-ink-muted line-clamp-3">{proposal.solutionText}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                  <span className="font-medium text-brand-dark">
                    {proposal.priceNegotiable ? "Kelishiladi" : formatMoney(proposal.proposedPrice)}
                  </span>
                  <span>{proposal.estimatedDays} kun</span>
                  <span>{formatDate(proposal.createdAt)}</span>
                </div>
              </div>
              <div className="mt-2 border-t border-surface-border pt-3">
                <p className="text-xs font-medium text-ink">Muallif: {proposal.scientistName}</p>
                <Link
                  to={`/app/expert/proposals/${proposal.id}`}
                  className="mt-3 inline-block w-full rounded-md bg-brand-primary px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
                >
                  Taklifni ko'rish va baholash
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
