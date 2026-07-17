import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-24 text-center">
      <Compass size={40} className="text-ink-muted" />
      <h1 className="text-2xl font-semibold text-brand-dark">Sahifa topilmadi</h1>
      <p className="text-sm text-ink-muted">So'ralgan sahifa mavjud emas yoki ko'chirilgan.</p>
      <Button asLink to="/">
        Bosh sahifaga qaytish
      </Button>
    </div>
  );
}
