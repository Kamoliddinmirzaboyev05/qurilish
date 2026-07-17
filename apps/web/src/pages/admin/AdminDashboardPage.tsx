import { Link } from "react-router-dom";
import { useAdminStats } from "@/features/admin/hooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, LoadingSkeleton } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administrator paneli" />

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Jami foydalanuvchilar" value={stats.totalUsers} />
          <StatCard label="Korxonalar" value={stats.totalCompanies} />
          <StatCard label="Olimlar" value={stats.totalScientists} />
          <StatCard label="Ochiq muammolar" value={stats.openProblems} />
          <StatCard label="Jami takliflar" value={stats.totalProposals} />
          <StatCard label="Tanlangan takliflar" value={stats.acceptedProposals} />
          <StatCard label="Bloklangan foydalanuvchilar" value={stats.blockedUsers} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/users" className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-slate-50">
          Foydalanuvchilarni ko'rish
        </Link>
        <Link to="/admin/problems" className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-slate-50">
          Muammolarni ko'rish
        </Link>
        <Link to="/admin/proposals" className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-slate-50">
          Takliflarni ko'rish
        </Link>
      </div>
    </div>
  );
}
