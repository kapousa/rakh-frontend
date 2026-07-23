import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, TrendingUp, AlertTriangle, FileText, ArrowUpRight, Plus } from "lucide-react";
import { api } from "../lib/api";
import Badge from "../components/ui/Badge";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listReports()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const criticalCount = reports.reduce(
    (sum, r) => sum + (r.anomalies || []).filter((a) => a.severity === "critical").length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.welcomeBack")} 👋</h1>
          <p className="text-gray-500 mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Link to="/reports/new" className="btn-primary">
          <Plus size={16} /> {t("nav.newReport")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("dashboard.reportsGenerated")} value={reports.length} icon={FileText} accent="bg-brand-600" />
        <StatCard label={t("dashboard.criticalAlerts")} value={criticalCount} icon={AlertTriangle} accent="bg-red-500" />
        <StatCard label={t("dashboard.avgRoas")} value="—" icon={TrendingUp} accent="bg-mint-500" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("dashboard.recentReports")}</h2>
          <Link to="/reports" className="text-sm font-medium text-brand-600 flex items-center gap-1 hover:underline">
            {t("dashboard.viewAll")} <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading && <p className="text-sm text-gray-400">{t("common.loading")}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="text-brand-400 mb-3" size={32} />
            <p className="text-gray-600 font-medium">{t("dashboard.noReportsYet")}</p>
            <p className="text-sm text-gray-400 mb-4">{t("dashboard.noReportsSubtitle")}</p>
            <Link to="/reports/new" className="btn-primary">{t("dashboard.createFirstReport")}</Link>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {reports.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">{r.period_label || "Untitled period"}</p>
                <p className="text-xs text-gray-400 capitalize">{r.platform} • {r.status}</p>
              </div>
              <div className="flex items-center gap-2">
                {(r.anomalies || []).some((a) => a.severity === "critical") && (
                  <Badge variant="critical">Critical</Badge>
                )}
                <Badge variant="success">{r.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
