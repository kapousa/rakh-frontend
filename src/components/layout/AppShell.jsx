import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, FileStack, Sparkles, Settings, UsersRound,
  ShieldCheck, LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import { useBranding } from "../../lib/useBranding";
import LanguageSwitcher from "../ui/LanguageSwitcher";

export default function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [agency, setAgency] = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    api.getAgency().then(setAgency).catch(() => {});
    api.checkPlatformAdmin().then((r) => setIsPlatformAdmin(r.is_platform_admin)).catch(() => {});
  }, []);

  const branding = useBranding(agency);

  const NAV_ITEMS = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/reports/new", label: t("nav.newReport"), icon: Sparkles },
    { to: "/reports", label: t("nav.allReports"), icon: FileStack },
    { to: "/clients", label: t("nav.clients"), icon: Users },
    { to: "/team", label: t("nav.team"), icon: UsersRound },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
    ...(isPlatformAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const reportsLimit = agency?.plan_features?.max_reports_per_month;
  const reportsUsed = agency?.reports_used_this_month;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.productName} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 text-white font-bold">
              {branding.productName?.[0] || "R"}
            </div>
          )}
          <span className="text-lg font-bold tracking-tight text-gray-900">{branding.productName}</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <Icon className="h-4.5 w-4.5" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3">
          <LanguageSwitcher />

          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 p-4 text-xs text-gray-600 border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1 capitalize">{agency?.plan || "Free"} plan</p>
            <p>
              {reportsLimit === -1
                ? t("sidebar.unlimitedReports")
                : t("sidebar.planUsage", { used: reportsUsed ?? 0, limit: reportsLimit ?? 5 })}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={18} />
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 lg:hidden">
          <span className="text-lg font-bold text-brand-700">{branding.productName}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </header>
        <main className="flex-1 px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
