import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import DeltaBadge from "../components/ui/DeltaBadge";
import Badge from "../components/ui/Badge";

function MetricTile({ label, value, delta }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {delta && (
        <div className="mt-1.5 flex justify-center">
          <DeltaBadge delta={delta} />
        </div>
      )}
    </div>
  );
}

export default function PublicReport() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.getPublicReport(token).then(setReport).catch((e) => setError(e.message));
  }, [token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await api.exportPublicPdf(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report?.client?.name || "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-sm text-center">
          <p className="font-semibold text-gray-900 mb-1">Link unavailable</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  const { client, agency, metrics, daily_series, anomalies, comparison, ai_summary, ai_recommendations } = report;
  const brandColor = client?.brand_primary_color || "#4F46E5";
  const deltas = comparison?.deltas || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {client?.logo_url && (
              <img src={client.logo_url} alt={client.name} className="h-10 w-10 rounded-lg object-cover" />
            )}
            <div>
              <p className="font-bold text-gray-900">{client?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{report.platform} Performance Report — {report.period_label}</p>
            </div>
          </div>
          <button onClick={handleDownload} className="btn-primary" disabled={downloading} style={{ backgroundColor: brandColor }}>
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {anomalies?.length > 0 && (
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                  a.severity === "critical" ? "bg-red-50 border-red-100 text-red-800" : "bg-amber-50 border-amber-100 text-amber-800"
                }`}
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <Badge variant={a.severity === "critical" ? "critical" : "warning"}>
                    {a.severity === "critical" ? "Critical Action Item" : "Warning"}
                  </Badge>
                  <p className="mt-1">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Key Metrics
            {comparison?.has_previous && (
              <span className="ml-2 text-xs font-normal text-gray-400">vs. {comparison.previous_period_label}</span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricTile label="Impressions" value={metrics.impressions?.toLocaleString()} delta={deltas.impressions} />
            <MetricTile label="Clicks" value={metrics.clicks?.toLocaleString()} delta={deltas.clicks} />
            <MetricTile label="CTR" value={`${metrics.ctr}%`} delta={deltas.ctr} />
            <MetricTile label="Spend" value={`$${metrics.spend?.toLocaleString()}`} delta={deltas.spend} />
            <MetricTile label="Conversions" value={metrics.conversions} delta={deltas.conversions} />
            <MetricTile label="CPA" value={`$${metrics.cpa}`} delta={deltas.cpa} />
            <MetricTile label="ROAS" value={`${metrics.roas}x`} delta={deltas.roas} />
            <MetricTile label="Revenue" value={`$${metrics.revenue?.toLocaleString()}`} delta={deltas.revenue} />
          </div>
        </div>

        {ai_summary && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Analysis & Insights</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              {ai_summary.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        {ai_recommendations?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Recommendations</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {ai_recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pt-4">
          Report prepared by {agency?.name || "your agency"} · Powered by Roasify
        </p>
      </div>
    </div>
  );
}
