import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-24 text-center">
      <ShieldAlert size={40} className="text-danger" />
      <h1 className="text-2xl font-semibold text-brand-dark">Sizda bu amal uchun ruxsat yo'q</h1>
      <p className="text-sm text-ink-muted">Ushbu sahifaga kirish uchun ruxsatingiz mavjud emas.</p>
      <Button asLink to="/">
        Bosh sahifaga qaytish
      </Button>
    </div>
  );
}
