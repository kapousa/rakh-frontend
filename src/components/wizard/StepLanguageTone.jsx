import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

export default function StepLanguageTone({ language, tone, pdfTheme, onChange }) {
  const { t } = useTranslation();

  const LANGUAGES = [
    { id: "en", label: t("wizard.langEnglish") },
    { id: "ar", label: t("wizard.langArabic") },
  ];
  const TONES = [
    { id: "professional", label: t("wizard.toneProfessional"), desc: t("wizard.toneProfessionalDesc") },
    { id: "aggressive", label: t("wizard.toneAggressive"), desc: t("wizard.toneAggressiveDesc") },
    { id: "casual", label: t("wizard.toneCasual"), desc: t("wizard.toneCasualDesc") },
  ];
  const THEMES = [
    { id: "corporate_blue", label: t("wizard.themeCorporateBlue"), color: "#1E40AF" },
    { id: "fresh_mint", label: t("wizard.themeFreshMint"), color: "#047857" },
    { id: "modern_minimalist", label: t("wizard.themeModernMinimalist"), color: "#18181B" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t("wizard.reportLanguage")}</h3>
        <div className="flex gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => onChange({ language: l.id })}
              className={cn(
                "rounded-xl border-2 px-5 py-2.5 text-sm font-medium transition",
                language === l.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-100 text-gray-600 hover:border-gray-200"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t("wizard.toneOfVoice")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TONES.map((toneOpt) => (
            <button
              key={toneOpt.id}
              onClick={() => onChange({ tone: toneOpt.id })}
              className={cn(
                "text-left rounded-xl border-2 p-4 transition",
                tone === toneOpt.id ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-gray-200"
              )}
            >
              <p className="font-medium text-gray-900 text-sm">{toneOpt.label}</p>
              <p className="text-xs text-gray-400">{toneOpt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t("wizard.pdfTheme")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((themeOpt) => (
            <button
              key={themeOpt.id}
              onClick={() => onChange({ pdfTheme: themeOpt.id })}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-3 transition",
                pdfTheme === themeOpt.id ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-gray-200"
              )}
            >
              <span className="h-6 w-6 rounded-md" style={{ backgroundColor: themeOpt.color }} />
              <span className="text-sm font-medium text-gray-800">{themeOpt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
