import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { UploadCloud, FileSpreadsheet, X, Zap, Link2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useBranding } from "../../lib/useBranding";

export default function StepUpload({
  file,
  onFileSelected,
  periodLabel,
  onPeriodLabelChange,
  activeConnection,
  mode,
  onModeChange,
  dateRange,
  onDateRangeChange,
}) {
  const { t } = useTranslation();
  const branding = useBranding();

  const onDrop = useCallback((accepted) => {
    if (accepted?.[0]) onFileSelected(accepted[0]);
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    disabled: mode === "connected",
  });

  const platformLabel = activeConnection?.platform === "google" ? "Google Ads" : activeConnection?.platform;

  return (
    <div className="space-y-6">
      {activeConnection && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{t("wizard.dataSource")}</h3>
          <p className="text-sm text-gray-500 mb-3">{t("wizard.hasConnectedAccount", { platform: platformLabel })}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onModeChange("manual")}
              className={cn(
                "text-left rounded-xl border-2 p-3 transition",
                mode === "manual" ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-gray-200"
              )}
            >
              <UploadCloud size={18} className="text-gray-500 mb-1.5" />
              <p className="text-sm font-medium text-gray-900">{t("wizard.uploadFile")}</p>
              <p className="text-xs text-gray-400">{t("wizard.csvExcelExport")}</p>
            </button>
            <button
              onClick={() => onModeChange("connected")}
              className={cn(
                "text-left rounded-xl border-2 p-3 transition",
                mode === "connected" ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-gray-200"
              )}
            >
              <Zap size={18} className="text-brand-500 mb-1.5" />
              <p className="text-sm font-medium text-gray-900">
                {t("wizard.pullFromAccount", { account: activeConnection.external_account_name || t("wizard.connectedAccount") })}
              </p>
              <p className="text-xs text-gray-400">{t("wizard.liveDataNoFile")}</p>
            </button>
          </div>
        </div>
      )}

      {mode === "connected" && activeConnection ? (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{t("wizard.dateRange")}</h3>
          <p className="text-sm text-gray-500 mb-4">{t("wizard.willPullLiveData", { productName: branding.productName })}</p>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("wizard.startDate")}</label>
              <input
                type="date"
                className="input-field"
                value={dateRange.start}
                max={dateRange.end}
                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("wizard.endDate")}</label>
              <input
                type="date"
                className="input-field"
                value={dateRange.end}
                min={dateRange.start}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <Link2 size={12} />
            {t("wizard.connectedVia", { id: activeConnection.external_account_id })}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{t("wizard.uploadCampaignExport")}</h3>
          <p className="text-sm text-gray-500 mb-4">{t("wizard.csvExcelHelp")}</p>

          {!file ? (
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition ${
                isDragActive ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-gray-50 hover:border-brand-300"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="text-brand-500 mb-3" size={36} />
              <p className="font-medium text-gray-700">{t("wizard.dragDropHere")}</p>
              <p className="text-sm text-gray-400">{t("wizard.dragDropSubtext")}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button onClick={() => onFileSelected(null)} className="text-gray-400 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("wizard.periodLabel")}</label>
        <input
          className="input-field max-w-sm"
          placeholder="e.g. June 2026"
          value={periodLabel}
          onChange={(e) => onPeriodLabelChange(e.target.value)}
        />
      </div>
    </div>
  );
}
