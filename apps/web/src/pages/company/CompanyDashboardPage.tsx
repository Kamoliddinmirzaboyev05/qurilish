import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useCompanyProblems, useCompanyStats } from "@/features/problems/hooks";
import { useCompanyRecentProposals } from "@/features/proposals/hooks";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard, Card, EmptyState, LoadingSkeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProblemStatusBadge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { formatDate, formatMoney, formatProposalCount } from "@/lib/format";

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const { data: problems, isLoading } = useCompanyProblems("ALL", 1);
  const { data: recentProposals } = useCompanyRecentProposals();
  const { data: stats, isLoading: statsLoading } = useCompanyStats();

  const items = problems?.items ?? [];
  const hasAnyProblems = items.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Xush kelibsiz, ${user?.name}`}
        action={
          <Button asLink to="/app/company/problems/new">
            <Plus size={16} /> Yangi muammo joylashtirish
          </Button>
        }
      />

      {!isLoading && !hasAnyProblems ? (
        <EmptyState
          title="Birinchi muammoingizni joylashtiring va olimlardan taklif oling."
          action={
            <Button asLink to="/app/company/problems/new">
              Muammo yaratish
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statsLoading || !stats ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingSkeleton key={i} className="h-24" />)
            ) : (
              <>
                <StatCard label="Ochiq muammolar" value={stats.openProblems} />
                <StatCard label="Jami takliflar" value={stats.totalProposals} />
                <StatCard label="Tanlangan olimlar" value={stats.matchedProblems} />
                <StatCard label="Yopilgan e'lonlar" value={stats.closedProblems} />
              </>
            )}
          </div>

          <div>
            <SectionHeader title="So'nggi muammolarim" action={<Link to="/app/company/problems" className="text-sm text-brand-primary">Barchasi</Link>} />
            <div className="mt-4 flex flex-col gap-3">
              {items.slice(0, 5).map((problem) => (
                <Card key={problem.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link to={`/problems/${problem.id}`} className="font-medium text-brand-dark hover:text-brand-primary">
                      {problem.title}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      {formatMoney(problem.budgetAmount)} · {formatProposalCount(problem.proposalCount)}
                    </p>
                  </div>
                  <ProblemStatusBadge status={problem.status} />
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Yangi takliflar" />
            <div className="mt-4 flex flex-col gap-3">
              {recentProposals && recentProposals.items.length > 0 ? (
                recentProposals.items.map((proposal) => (
                  <Card key={proposal.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-dark">{proposal.scientistName}</p>
                      <p className="text-sm text-ink-muted">{proposal.problemTitle}</p>
                    </div>
                    <div className="text-right text-sm text-ink-muted">
                      <p className="font-medium text-brand-dark">
                        {proposal.priceNegotiable ? "Kelishiladi" : formatMoney(proposal.proposedPrice)}
                      </p>
                      <p>{formatDate(proposal.createdAt)}</p>
                    </div>
                  </Card>
                ))
              ) : (
                <EmptyState title="Ushbu muammoga hali taklif kelmagan." />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
