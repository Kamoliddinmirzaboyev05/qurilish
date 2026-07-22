import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useProblems } from "@/features/problems/hooks";
import { useMyProposals } from "@/features/proposals/hooks";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard, Card, EmptyState, LoadingSkeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProposalStatusBadge } from "@/components/ui/Badge";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { formatDate, formatMoney } from "@/lib/format";

export default function ScientistDashboardPage() {
  const { user } = useAuth();
  const { data: problems, isLoading: problemsLoading } = useProblems({ sort: "newest", page: 1, pageSize: 3 });
  const { data: myProposals, isLoading: proposalsLoading } = useMyProposals();

  const proposals = myProposals?.items ?? [];
  const submitted = proposals.length;
  const accepted = proposals.filter((p) => p.status === "ACCEPTED").length;
  const pending = proposals.filter((p) => p.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Xush kelibsiz, ${user?.name}`}
        action={
          <Button asLink to="/app/problems">
            Muammolarni ko'rish
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ochiq muammolar" value={problems?.total ?? "—"} />
        <StatCard label="Yuborilgan takliflar" value={submitted} />
        <StatCard label="Qabul qilingan" value={accepted} />
        <StatCard label="Kutilayotgan" value={pending} />
      </div>

      <div>
        <SectionHeader title="Yangi muammolar" action={<Link to="/app/problems" className="text-sm text-brand-primary">Barchasi</Link>} />
        <div className="mt-4">
          {problemsLoading ? (
            <LoadingSkeleton className="h-40 w-full" />
          ) : problems && problems.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {problems.items.map((p) => (
                <ProblemCard key={p.id} problem={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="O'zingizga mos muammoni toping va birinchi taklifingizni yuboring." />
          )}
        </div>
      </div>

      <div>
        <SectionHeader title="So'nggi takliflarim" />
        <div className="mt-4 flex flex-col gap-3">
          {proposalsLoading ? (
            <LoadingSkeleton className="h-24 w-full" />
          ) : proposals.length > 0 ? (
            proposals.slice(0, 5).map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-brand-dark">{p.problemTitle}</p>
                  <p className="text-sm text-ink-muted">
                    {p.priceNegotiable ? "Kelishiladi" : formatMoney(p.proposedPrice)} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <ProposalStatusBadge status={p.status} />
              </Card>
            ))
          ) : (
            <EmptyState title="Siz hali taklif yubormagansiz." />
          )}
        </div>
      </div>
    </div>
  );
}
