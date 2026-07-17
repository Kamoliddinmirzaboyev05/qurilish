import clsx from "clsx";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-card border border-surface-border bg-surface-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-2xl font-semibold text-brand-dark">{value}</span>
    </Card>
  );
}

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-surface-border bg-white px-6 py-14 text-center">
      <Inbox className="text-ink-muted" size={32} aria-hidden />
      <p className="text-sm text-ink-muted">{title}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Ma'lumotlarni yuklashda xatolik yuz berdi.", onRetry }: { title?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-danger/20 bg-red-50 px-6 py-14 text-center">
      <AlertCircle className="text-danger" size={32} aria-hidden />
      <p className="text-sm text-danger">{title}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={16} /> Qayta urinib ko'rish
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-3">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-5 w-full" />
          <LoadingSkeleton className="h-4 w-2/3" />
          <LoadingSkeleton className="h-10 w-full" />
        </Card>
      ))}
    </div>
  );
}
