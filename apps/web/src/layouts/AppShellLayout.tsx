import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { LogoWithText } from "@/components/shared/Logo";
import { UserAvatar } from "@/components/ui/Avatar";
import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";
import clsx from "clsx";

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
}

const navByRole: Record<string, NavItem[]> = {
  COMPANY: [
    { label: "Boshqaruv paneli", to: "/app/company", end: true },
    { label: "Muammolarim", to: "/app/company/problems" },
    { label: "Bog'lanishlar", to: "/app/connections" },
    { label: "Profil", to: "/app/profile" },
  ],
  SCIENTIST: [
    { label: "Boshqaruv paneli", to: "/app/scientist", end: true },
    { label: "Muammolar banki", to: "/problems" },
    { label: "Takliflarim", to: "/app/scientist/proposals" },
    { label: "Bog'lanishlar", to: "/app/connections" },
    { label: "Profil", to: "/app/profile" },
  ],
  ADMIN: [
    { label: "Boshqaruv paneli", to: "/admin", end: true },
    { label: "Foydalanuvchilar", to: "/admin/users" },
    { label: "Muammolar", to: "/admin/problems" },
    { label: "Takliflar", to: "/admin/proposals" },
    { label: "Profil", to: "/app/profile" },
  ],
};

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150",
              isActive ? "bg-brand-primary/10 text-brand-primary" : "text-ink-muted hover:bg-slate-100 hover:text-ink"
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShellLayout() {
  const { user, setUser } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;
  const items = navByRole[user.role] ?? [];

  async function handleLogout() {
    await api.post("/auth/logout");
    setUser(null);
    navigate("/");
  }

  return (
    <div className="flex min-h-screen bg-surface-page">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-surface-border bg-white p-5 md:flex">
        <Link to="/" className="mb-8">
          <LogoWithText size={26} />
        </Link>
        <NavLinks items={items} />
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-danger hover:bg-red-50"
        >
          <LogOut size={16} /> Chiqish
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 md:justify-end">
          <button className="text-ink md:hidden" onClick={() => setDrawerOpen(true)} aria-label="Menyuni ochish">
            <Menu size={24} />
          </button>
          <UserAvatar name={user!.name} size={36} />
        </header>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-hidden />
            <div className="absolute left-0 top-0 h-full w-72 bg-white p-5 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <LogoWithText size={26} />
                <button onClick={() => setDrawerOpen(false)} aria-label="Yopish">
                  <X size={22} />
                </button>
              </div>
              <NavLinks items={items} onNavigate={() => setDrawerOpen(false)} />
              <button
                onClick={handleLogout}
                className="mt-6 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-danger hover:bg-red-50"
              >
                <LogOut size={16} /> Chiqish
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
