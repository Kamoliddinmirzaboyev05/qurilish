import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProposal, useExpertReviewProposal } from "@/features/proposals/hooks";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { ProposalStatusBadge } from "@/components/ui/Badge";
import { ConfirmationDialog } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/toast";
import { ApiRequestError, API_BASE } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

export default function ExpertProposalReviewPage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { data: proposal, isLoading } = useProposal(proposalId);
  const reviewMutation = useExpertReviewProposal();

  const [confirmStatus, setConfirmStatus] = useState<"APPROVE" | "REJECT" | null>(null);

  if (isLoading) return <div className="p-8 text-center text-ink-muted">Yuklanmoqda...</div>;
  if (!proposal) return <EmptyState title="Taklif topilmadi" />;

  async function handleConfirm() {
    if (!confirmStatus) return;
    try {
      await reviewMutation.mutateAsync({ proposalId: proposal!.id, status: confirmStatus });
      notify.success(confirmStatus === "APPROVE" ? "Taklif ma'qullandi." : "Taklif rad etildi.");
      navigate("/app/expert");
    } catch (err) {
      if (err instanceof ApiRequestError) notify.error(err.message);
    } finally {
      setConfirmStatus(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Ekspertiza paneli", to: "/app/expert" }, { label: "Taklifni baholash" }]} />

      <PageHeader
        title="Taklif tafsilotlari"
        action={<ProposalStatusBadge status={proposal.status} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-brand-dark">Yechim tavsifi</h3>
            <p className="whitespace-pre-wrap text-sm text-ink">{proposal.solutionText}</p>

            {proposal.attachmentOriginalName && (
              <div className="mt-6 rounded-md border border-surface-border bg-surface-muted p-4">
                <p className="mb-2 text-sm font-medium text-brand-dark">Ilova qilingan fayl:</p>
                <a
                  href={`${API_BASE}/proposals/${proposal.id}/attachment`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-brand-primary hover:underline"
                >
                  {proposal.attachmentOriginalName}
                </a>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="flex flex-col gap-4">
            <h3 className="font-semibold text-brand-dark">Muammo haqida</h3>
            <div>
              <p className="text-xs text-ink-muted">Sarlavha</p>
              <p className="text-sm font-medium text-ink">{proposal.problemTitle}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Korxona</p>
              <p className="text-sm font-medium text-ink">{proposal.companyName}</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="font-semibold text-brand-dark">Olim haqida</h3>
            <div>
              <p className="text-xs text-ink-muted">Ism-sharif</p>
              <p className="text-sm font-medium text-ink">{proposal.scientistName}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Tashkilot</p>
              <p className="text-sm font-medium text-ink">{proposal.organization || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Mutaxassislik</p>
              <p className="text-sm font-medium text-ink">{proposal.specialization || "—"}</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="font-semibold text-brand-dark">Shartlar</h3>
            <div>
              <p className="text-xs text-ink-muted">Budjet/Narx</p>
              <p className="text-sm font-medium text-ink">
                {proposal.priceNegotiable ? "Kelishiladi" : formatMoney(proposal.proposedPrice)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Muddat</p>
              <p className="text-sm font-medium text-ink">{proposal.estimatedDays} kun</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Yuborilgan vaqt</p>
              <p className="text-sm font-medium text-ink">{formatDate(proposal.createdAt)}</p>
            </div>
          </Card>

          {proposal.status === "PENDING" && (
            <Card className="flex flex-col gap-3 border-brand-teal/20 bg-brand-teal/5">
              <h3 className="font-semibold text-brand-teal">Ekspert xulosasi</h3>
              <p className="text-xs text-ink-muted">
                Iltimos, taklifning texnik va iqtisodiy jihatdan muammoga yechim bo'la olishini tasdiqlang.
              </p>
              <div className="mt-2 flex gap-3">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmStatus("APPROVE")}>
                  Ma'qullash
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => setConfirmStatus("REJECT")}>
                  Rad etish
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={handleConfirm}
        title={confirmStatus === "APPROVE" ? "Taklifni ma'qullaysizmi?" : "Taklifni rad etasizmi?"}
        description={
          confirmStatus === "APPROVE"
            ? "Ushbu taklif korxonaga ko'rsatiladi va ular buni qabul qilib olim bilan ishlashlari mumkin bo'ladi."
            : "Bu taklif rad etiladi va u keyingi bosqichga o'tmaydi."
        }
        confirmLabel={confirmStatus === "APPROVE" ? "Ha, ma'qullash" : "Ha, rad etish"}
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}
