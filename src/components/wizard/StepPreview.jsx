import { useTranslation } from "react-i18next";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Badge from "../ui/Badge";
import DeltaBadge from "../ui/DeltaBadge";

function MetricTile({ label, value, delta }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {delta && (
        <div className="mt-1 flex justify-center">
          <DeltaBadge delta={delta} />
        </div>
      )}
    </div>
  );
}

export default function StepPreview({ analysis, summary, onSummaryChange, recommendations, onRecommendationsChange }) {
  const { t } = useTranslation();

  if (!analysis) {
    return <p className="text-sm text-gray-400">{t("wizard.waitingAnalysis")}</p>;
  }

  const { metrics, daily_series, anomalies } = analysis;
  const deltas = analysis.comparison?.deltas || {};

  return (
    <div className="space-y-8">
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
                  {a.severity === "critical" ? t("wizard.criticalActionItem") : t("wizard.warning")}
                </Badge>
                <p className="mt-1">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {t("wizard.keyMetrics")}
          {analysis.comparison?.has_previous && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {t("wizard.vsPreviousPeriod", { period: analysis.comparison.previous_period_label || t("wizard.previousPeriod") })}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricTile label={t("wizard.metricImpressions")} value={metrics.impressions?.toLocaleString()} delta={deltas.impressions} />
          <MetricTile label={t("wizard.metricClicks")} value={metrics.clicks?.toLocaleString()} delta={deltas.clicks} />
          <MetricTile label={t("wizard.metricCtr")} value={`${metrics.ctr}%`} delta={deltas.ctr} />
          <MetricTile label={t("wizard.metricSpend")} value={`$${metrics.spend?.toLocaleString()}`} delta={deltas.spend} />
          <MetricTile label={t("wizard.metricConversions")} value={metrics.conversions} delta={deltas.conversions} />
          <MetricTile label={t("wizard.metricCpa")} value={`$${metrics.cpa}`} delta={deltas.cpa} />
          <MetricTile label={t("wizard.metricRoas")} value={`${metrics.roas}x`} delta={deltas.roas} />
          <MetricTile label={t("wizard.metricRevenue")} value={`$${metrics.revenue?.toLocaleString()}`} delta={deltas.revenue} />
        </div>
      </div>

      {daily_series?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">{t("wizard.dailySpendTrend")}</h3>
          <div className="h-56 rounded-xl border border-gray-100 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="spend" stroke="#4F46E5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">{t("wizard.aiSummary")} <span className="text-xs font-normal text-gray-400">{t("wizard.editable")}</span></h3>
        <textarea
          className="input-field min-h-[160px] leading-relaxed"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
        />
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">{t("wizard.recommendations")} <span className="text-xs font-normal text-gray-400">{t("wizard.editable")}</span></h3>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2">
              {rec.toUpperCase().startsWith("CRITICAL") ? (
                <TrendingDown size={16} className="mt-2.5 text-red-500 shrink-0" />
              ) : (
                <TrendingUp size={16} className="mt-2.5 text-emerald-500 shrink-0" />
              )}
              <textarea
                className="input-field flex-1"
                rows={2}
                value={rec}
                onChange={(e) => {
                  const next = [...recommendations];
                  next[i] = e.target.value;
                  onRecommendationsChange(next);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
