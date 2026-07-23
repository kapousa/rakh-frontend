import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Trash2, AlertTriangle, Link2, Check, Zap, Send, PauseCircle, Clock } from "lucide-react";
import { api } from "../lib/api";
import Badge from "../components/ui/Badge";
import DeltaBadge from "../components/ui/DeltaBadge";

function timeUntil(isoString) {
  const diffMs = new Date(isoString) - new Date();
  if (diffMs <= 0) return "shortly";
  const hours = Math.round(diffMs / 3600000);
  if (hours < 1) return "in under an hour";
  if (hours < 24) return `in ~${hours}h`;
  return `in ~${Math.round(hours / 24)}d`;
}

function PendingReviewCard({ report, onAction, t }) {
  const critical = (report.anomalies || []).filter((a) => a.severity === "critical").length;
  return (
    <div className="card border-l-4 border-l-brand-500">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-brand-500" />
            <p className="font-semibold text-gray-900 text-sm">{t("reports.autoPulledReady")}</p>
          </div>
          <p className="text-xs text-gray-400 capitalize">{report.platform} · {report.period_label}</p>
        </div>
        {critical > 0 && <Badge variant="critical"><AlertTriangle size={12} /> {critical} critical</Badge>}
      </div>

      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
        <Clock size={12} />
        {report.review_send_at
          ? t("reports.willAutoSend", { time: timeUntil(report.review_send_at) })
          : t("reports.waitingApproval")}
      </p>

      <div className="mt-3 flex gap-2">
        <button onClick={() => onAction(report.id, "approve")} className="btn-primary text-xs px-3 py-1.5">
          <Send size={13} /> {t("reports.approveAndSend")}
        </button>
        <button onClick={() => onAction(report.id, "hold")} className="btn-secondary text-xs px-3 py-1.5">
          <PauseCircle size={13} /> {t("reports.hold")}
        </button>
      </div>
    </div>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = () => api.listReports().then(setReports).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const handleExport = async (id, label) => {
    const blob = await api.exportPdf(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label || "report"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("common.delete") + "?")) return;
    await api.deleteReport(id);
    refresh();
  };

  const handleToggleShare = async (report) => {
    const updated = await api.updateShareLink(report.id, !report.public_share_enabled);
    setReports((prev) => prev.map((r) => (r.id === report.id ? updated : r)));
  };

  const handleCopyLink = (report) => {
    const url = `${window.location.origin}/share/${report.public_share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReviewAction = async (reportId, action) => {
    try {
      await api.reviewReport(reportId, action);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const pendingReview = reports.filter((r) => r.review_status === "pending_review");
  const otherReports = reports.filter((r) => r.review_status !== "pending_review");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("reports.title")}</h1>
        <p className="text-gray-500 mt-1">{t("reports.subtitle")}</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</div>}

      {pendingReview.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("reports.awaitingReview")} ({pendingReview.length})</h2>
          {pendingReview.map((r) => (
            <PendingReviewCard key={r.id} report={r} onAction={handleReviewAction} t={t} />
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">{t("reports.period")}</th>
              <th className="text-left px-5 py-3">{t("reports.platform")}</th>
              <th className="text-left px-5 py-3">{t("reports.source")}</th>
              <th className="text-left px-5 py-3">{t("reports.roas")}</th>
              <th className="text-left px-5 py-3">{t("reports.status")}</th>
              <th className="text-left px-5 py-3">{t("reports.alerts")}</th>
              <th className="text-left px-5 py-3">{t("reports.clientLink")}</th>
              <th className="text-right px-5 py-3">{t("reports.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={8} className="px-5 py-6 text-center text-gray-400">{t("common.loading")}</td></tr>
            )}
            {!loading && otherReports.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-6 text-center text-gray-400">{t("reports.noReports")}</td></tr>
            )}
            {otherReports.map((r) => {
              const critical = (r.anomalies || []).filter((a) => a.severity === "critical").length;
              const roasDelta = r.comparison?.deltas?.roas;
              return (
                <tr key={r.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.period_label || "—"}</td>
                  <td className="px-5 py-3 capitalize text-gray-600">{r.platform}</td>
                  <td className="px-5 py-3">
                    {r.source === "auto_sync" ? (
                      <Badge variant="info"><Zap size={11} /> {t("reports.auto")}</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">{t("reports.manual")}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700">{r.metrics?.roas ?? "—"}x</span>
                      {roasDelta && <DeltaBadge delta={roasDelta} />}
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge variant="success">{r.status}</Badge></td>
                  <td className="px-5 py-3">
                    {critical > 0 ? (
                      <Badge variant="critical"><AlertTriangle size={12} /> {critical} critical</Badge>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.public_share_enabled}
                          onChange={() => handleToggleShare(r)}
                          className="h-3.5 w-3.5 rounded accent-brand-600"
                        />
                      </label>
                      {r.public_share_enabled && (
                        <button
                          onClick={() => handleCopyLink(r)}
                          className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                        >
                          {copiedId === r.id ? <Check size={12} /> : <Link2 size={12} />}
                          {copiedId === r.id ? t("reports.copied") : t("reports.copyLink")}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleExport(r.id, r.period_label)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 mr-1">
                      <Download size={15} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
