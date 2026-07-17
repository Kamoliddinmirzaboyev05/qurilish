import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ProblemListItem } from "@buildscience/shared";
import { Card } from "@/components/ui/Card";
import { CategoryBadge, ProblemStatusBadge } from "@/components/ui/Badge";
import { formatMoney, formatProposalCount, formatRelative } from "@/lib/format";

export function ProblemCard({ problem }: { problem: ProblemListItem }) {
  return (
    <Card className="flex flex-col gap-3 transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge category={problem.category} />
        <ProblemStatusBadge status={problem.status} />
      </div>
      <Link to={`/problems/${problem.id}`} className="line-clamp-2 text-base font-semibold text-brand-dark hover:text-brand-primary">
        {problem.title}
      </Link>
      <p className="line-clamp-3 text-sm text-ink-muted">{problem.descriptionExcerpt}</p>
      <div className="mt-auto flex flex-col gap-2 border-t border-surface-border pt-3 text-sm">
        <div className="flex items-center justify-between text-ink-muted">
          <span>{problem.companyName}</span>
          <span>{formatRelative(problem.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-brand-dark">{formatMoney(problem.budgetAmount)}</span>
          <span className="text-ink-muted">{formatProposalCount(problem.proposalCount)}</span>
        </div>
      </div>
      <Link
        to={`/problems/${problem.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-primaryHover"
      >
        Batafsil <ArrowRight size={16} />
      </Link>
    </Card>
  );
}
