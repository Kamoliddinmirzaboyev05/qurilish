import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "./Button";
import { formatNumber } from "@/lib/format";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <IconButton label="Oldingi sahifa" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={18} />
      </IconButton>
      <span className="text-sm text-ink-muted">
        {formatNumber(page)} / {formatNumber(totalPages)}
      </span>
      <IconButton label="Keyingi sahifa" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={18} />
      </IconButton>
    </div>
  );
}
