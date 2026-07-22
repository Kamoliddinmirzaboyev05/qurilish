import { Users, Building2, GraduationCap, AlertCircle, FileText, CheckCircle, Ban } from "lucide-react";
import { useAdminStats } from "@/features/admin/hooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, LoadingSkeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administrator paneli" />

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[88px] rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Jami foydalanuvchilar" value={stats.totalUsers} icon={<Users size={20} />} color="brand" />
          <StatCard label="Korxonalar" value={stats.totalCompanies} icon={<Building2 size={20} />} color="amber" />
          <StatCard label="Olimlar" value={stats.totalScientists} icon={<GraduationCap size={20} />} color="green" />
          <StatCard label="Ochiq muammolar" value={stats.openProblems} icon={<AlertCircle size={20} />} color="brand" />
          <StatCard label="Jami takliflar" value={stats.totalProposals} icon={<FileText size={20} />} color="amber" />
          <StatCard label="Tanlangan takliflar" value={stats.acceptedProposals} icon={<CheckCircle size={20} />} color="green" />
          <StatCard label="Bloklangan foydalanuvchilar" value={stats.blockedUsers} icon={<Ban size={20} />} color="red" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asLink to="/admin/users" variant="outline">
          Foydalanuvchilarni ko'rish
        </Button>
        <Button asLink to="/admin/problems" variant="outline">
          Muammolarni ko'rish
        </Button>
        <Button asLink to="/admin/proposals" variant="outline">
          Takliflarni ko'rish
        </Button>
      </div>
    </div>
  );
}
