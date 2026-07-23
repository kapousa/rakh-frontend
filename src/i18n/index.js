import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ar from "./ar.json";

const STORAGE_KEY = "rakh_language";

const savedLanguage = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLanguage || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes
});

/** Keep <html dir="rtl"/lang="ar"> in sync with the active language —
 * Arabic needs the document to actually flip direction, not just the text. */
function applyDocumentDirection(lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

applyDocumentDirection(i18n.language);

i18n.on("languageChanged", (lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
  applyDocumentDirection(lang);
});

export default i18n;
