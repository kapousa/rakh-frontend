import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { useBranding } from "../../lib/useBranding";

const PLATFORMS = [
  { id: "meta", label: "Meta Ads", desc: "Facebook & Instagram", color: "from-blue-500 to-indigo-500" },
  { id: "google", label: "Google Ads", desc: "Search, Display, YouTube", color: "from-amber-400 to-red-500" },
  { id: "tiktok", label: "TikTok Ads", desc: "TikTok for Business", color: "from-slate-700 to-slate-900" },
];

export default function StepPlatform({ platform, onChange, clients, clientId, onClientChange }) {
  const { t } = useTranslation();
  const branding = useBranding();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{t("wizard.whichPlatform")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("wizard.platformHelp", { productName: branding.productName })}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={cn(
                "text-left rounded-2xl border-2 p-4 transition",
                platform === p.id ? "border-brand-600 bg-brand-50" : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${p.color} mb-3`} />
              <p className="font-semibold text-gray-900">{p.label}</p>
              <p className="text-xs text-gray-400">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{t("wizard.whichClient")}</h3>
        <p className="text-sm text-gray-500 mb-3">{t("wizard.clientHelp")}</p>
        <select className="input-field max-w-sm" value={clientId} onChange={(e) => onClientChange(e.target.value)}>
          <option value="">{t("wizard.selectClient")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
