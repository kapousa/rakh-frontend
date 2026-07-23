import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { useBranding } from "../lib/useBranding";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const branding = useBranding(); // no agency yet (pre-login) — resolves via custom-domain lookup or default RAKH branding
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-emerald-50 px-4">
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm card">
        <div className="text-center mb-6">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.productName} className="mx-auto mb-3 h-11 w-11 rounded-2xl object-cover" />
          ) : (
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-mint-500 text-white font-bold text-lg">
              {branding.productName?.[0] || "R"}
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900">{t("login.welcome", { productName: branding.productName })}</h1>
          <p className="text-sm text-gray-400">{t("login.tagline")}</p>
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" required placeholder={t("login.email")} className="input-field"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder={t("login.password")} className="input-field"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn-primary w-full">
            {mode === "signin" ? t("login.signIn") : t("login.createAccount")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          {mode === "signin"
            ? t("login.newToProduct", { productName: branding.productName })
            : t("login.alreadyHaveAccount")}{" "}
          <button
            className="text-brand-600 font-medium hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? t("login.createAccountLink") : t("login.signInLink")}
          </button>
        </p>
      </div>
    </div>
  );
}
