import { useState } from "react";
import { PROPOSAL_STATUS_LABELS_UZ, type ProposalListItem } from "@buildscience/shared";
import { useAdminProposals, useDeleteAdminProposal } from "@/features/admin/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, FilterBar } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { Card, EmptyState, CardGridSkeleton } from "@/components/ui/Card";
import { ProposalStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationDialog } from "@/components/ui/Modal";
import { notify } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

export default function AdminProposalsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProposalListItem | null>(null);

  const debouncedSearch = useDebounce(search);
  const { data, isLoading } = useAdminProposals({ search: debouncedSearch, status, page });
  const deleteMutation = useDeleteAdminProposal();

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      notify.success("Taklif o'chirildi.");
    } catch (err) {
      if (err instanceof ApiRequestError) notify.error(err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Takliflar" />

      <FilterBar>
        <div className="min-w-[220px] flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Olim yoki muammo bo'yicha qidiring" />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[{ value: "ALL", label: "Barcha holatlar" }, ...Object.entries(PROPOSAL_STATUS_LABELS_UZ).map(([value, label]) => ({ value, label }))]}
        />
      </FilterBar>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : data && data.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.items.map((proposal) => (
            <Card key={proposal.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[220px] flex-1">
                <div className="mb-1">
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <p className="font-medium text-brand-dark">{proposal.scientistName}</p>
                <p className="text-sm text-ink-muted">{proposal.problemTitle}</p>
                <p className="text-xs text-ink-muted">
                  {proposal.priceNegotiable ? "Kelishiladi" : formatMoney(proposal.proposedPrice)} · {proposal.estimatedDays} kun ·{" "}
                  {formatDate(proposal.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {proposal.attachmentOriginalName && (
                  <a
                    href={`/api/proposals/${proposal.id}/attachment`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-brand-primary"
                  >
                    Faylni yuklab olish
                  </a>
                )}
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(proposal)}>
                  O'chirish
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Berilgan mezonlarga mos ma'lumot topilmadi." />
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Ushbu taklifni o'chirasizmi?"
        description="Bu amalni ortga qaytarib bo'lmaydi."
        danger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
