import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import StepIndicator from "../components/wizard/StepIndicator";
import StepPlatform from "../components/wizard/StepPlatform";
import StepUpload from "../components/wizard/StepUpload";
import StepLanguageTone from "../components/wizard/StepLanguageTone";
import StepPreview from "../components/wizard/StepPreview";
import { useBranding } from "../lib/useBranding";

export default function ReportWizard() {
  const { t } = useTranslation();
  const branding = useBranding();
  const navigate = useNavigate();
  const STEPS = [t("wizard.stepPlatform"), t("wizard.stepUpload"), t("wizard.stepStyle"), t("wizard.stepPreview")];
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);

  // Wizard state
  const [platform, setPlatform] = useState("meta");
  const [clientId, setClientId] = useState("");
  const [file, setFile] = useState(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("professional");
  const [pdfTheme, setPdfTheme] = useState("corporate_blue");

  // Hybrid data-source state: "manual" (CSV, default) vs "connected" (live pull)
  const [activeConnection, setActiveConnection] = useState(null);
  const [mode, setMode] = useState("manual");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return { start: monthAgo.toISOString().split("T")[0], end: today.toISOString().split("T")[0] };
  });

  const [analysis, setAnalysis] = useState(null);
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [savedReportId, setSavedReportId] = useState(null);
  const [savedReport, setSavedReport] = useState(null);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { api.listClients().then(setClients); }, []);

  // Whenever the client or platform changes, check for a matching active
  // connection so Step 2 can offer the "pull from connected account" path.
  useEffect(() => {
    setActiveConnection(null);
    setMode("manual");
    if (!clientId) return;
    api.listConnections(clientId).then((connections) => {
      const match = connections.find((c) => c.platform === platform && c.sync_enabled && c.external_account_id);
      if (match) {
        setActiveConnection(match);
        setMode("connected"); // default to the live pull when one's available — that's the point of connecting
      }
    }).catch(() => {}); // no connections yet is a normal, silent case
  }, [clientId, platform]);

  const canProceed = {
    1: platform && clientId,
    2: mode === "connected" ? !!(dateRange.start && dateRange.end) : !!file,
    3: true,
    4: true,
  }[step];

  async function handleNext() {
    setError(null);
    if (step === 2) {
      // Leaving upload step → advance to style step; analysis happens on step 3 -> 4 transition
      setStep(3);
      return;
    }
    if (step === 3) {
      await runAnalysis();
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    try {
      let result;
      if (mode === "connected" && activeConnection) {
        result = await api.previewConnectionPull(activeConnection.id, {
          start_date: dateRange.start,
          end_date: dateRange.end,
          language,
          tone,
          period_label: periodLabel || undefined,
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("platform", platform);
        formData.append("client_id", clientId);
        formData.append("language", language);
        formData.append("tone", tone);
        if (periodLabel) formData.append("period_label", periodLabel);
        result = await api.analyzeUpload(formData);
      }

      setAnalysis(result);
      setSummary(result.ai_summary);
      setRecommendations(result.ai_recommendations);
      if (result.period_label && !periodLabel) setPeriodLabel(result.period_label);
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveAndExport() {
    if (!analysis) return;
    setSaving(true);
    setError(null);
    try {
      const report = await api.createReport({
        meta: {
          client_id: clientId,
          platform,
          period_label: periodLabel,
          language,
          tone,
          pdf_theme: pdfTheme,
          source: mode === "connected" ? "auto_sync" : "manual_upload",
          connection_id: mode === "connected" ? activeConnection?.id : null,
        },
        metrics: analysis.metrics,
        daily_series: analysis.daily_series,
        anomalies: analysis.anomalies,
        ai_summary: summary,
        ai_recommendations: recommendations,
      });
      setSavedReportId(report.id);
      setSavedReport(report);
      // Surface the server-computed month-over-month comparison in the preview.
      setAnalysis((prev) => ({ ...prev, comparison: report.comparison }));

      setExporting(true);
      const blob = await api.exportPdf(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${periodLabel || "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
      setExporting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("wizard.title")}</h1>
      <p className="text-gray-500 mb-6">{t("wizard.subtitle", { productName: branding.productName })}</p>

      <div className="card">
        <StepIndicator steps={STEPS} currentStep={step} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {step === 1 && (
          <StepPlatform
            platform={platform}
            onChange={setPlatform}
            clients={clients}
            clientId={clientId}
            onClientChange={setClientId}
          />
        )}

        {step === 2 && (
          <StepUpload
            file={file}
            onFileSelected={setFile}
            periodLabel={periodLabel}
            onPeriodLabelChange={setPeriodLabel}
            activeConnection={activeConnection}
            mode={mode}
            onModeChange={setMode}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}

        {step === 3 && (
          <StepLanguageTone
            language={language}
            tone={tone}
            pdfTheme={pdfTheme}
            onChange={(patch) => {
              if (patch.language) setLanguage(patch.language);
              if (patch.tone) setTone(patch.tone);
              if (patch.pdfTheme) setPdfTheme(patch.pdfTheme);
            }}
          />
        )}

        {step === 4 && (
          <StepPreview
            analysis={analysis}
            summary={summary}
            onSummaryChange={setSummary}
            recommendations={recommendations}
            onRecommendationsChange={setRecommendations}
          />
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
          <button
            className="btn-secondary"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            <ChevronLeft size={16} /> {t("wizard.back")}
          </button>

          {step < 4 ? (
            <button className="btn-primary" disabled={!canProceed || analyzing} onClick={handleNext}>
              {analyzing ? (
                <><Loader2 size={16} className="animate-spin" /> {t("wizard.analyzing")}</>
              ) : (
                <>{step === 3 ? t("wizard.runAnalysis") : t("wizard.continue")} <ChevronRight size={16} /></>
              )}
            </button>
          ) : (
            <button className="btn-primary" disabled={saving || exporting} onClick={handleSaveAndExport}>
              {saving || exporting ? (
                <><Loader2 size={16} className="animate-spin" /> {exporting ? t("wizard.exportingPdf") : t("wizard.savingReport")}</>
              ) : (
                <><Download size={16} /> {t("wizard.saveExport")}</>
              )}
            </button>
          )}
        </div>
      </div>

      {savedReportId && (
        <div className="mt-4 card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{t("wizard.shareLink")}</p>
              <p className="text-xs text-gray-400">{t("wizard.shareLinkHelp")}</p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shareEnabled}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  setShareEnabled(enabled);
                  const updated = await api.updateShareLink(savedReportId, enabled);
                  setSavedReport(updated);
                }}
                className="h-4 w-4 rounded accent-brand-600"
              />
              <span className="text-sm text-gray-600">{shareEnabled ? t("wizard.enabled") : t("wizard.disabled")}</span>
            </label>
          </div>

          {shareEnabled && savedReport?.public_share_token && (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                className="input-field flex-1 text-xs text-gray-500"
                value={`${window.location.origin}/share/${savedReport.public_share_token}`}
              />
              <button
                type="button"
                className="btn-secondary shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/${savedReport.public_share_token}`);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
              >
                {shareCopied ? t("wizard.copied") : t("wizard.copyLink")}
              </button>
            </div>
          )}

          <p className="text-sm text-center text-gray-400 mt-4">
            <button className="text-brand-600 font-medium hover:underline" onClick={() => navigate("/reports")}>
              {t("wizard.viewAllReports")} →
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
