import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Check, Lock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../lib/api";

export default function Settings() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState(null);
  const [agencyName, setAgencyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  // White-label reseller settings (Enterprise-gated)
  const [hasRebrandFeature, setHasRebrandFeature] = useState(false);
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [platformDisplayName, setPlatformDisplayName] = useState("");
  const [platformLogoUrl, setPlatformLogoUrl] = useState(null);
  const [platformLogoFile, setPlatformLogoFile] = useState(null);
  const [customDomain, setCustomDomain] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [domainVerifiedAt, setDomainVerifiedAt] = useState(null);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [domainCheckResult, setDomainCheckResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      try {
        const agency = await api.getAgency();
        setAgencyName(agency.name || "");
        setPrimaryColor(agency.primary_color || "#4F46E5");
        setLogoUrl(agency.logo_url || null);
        setNotificationEmail(agency.notification_email || "");
        setSlackWebhookUrl(agency.slack_webhook_url || "");

        setHasRebrandFeature(!!agency.plan_features?.platform_rebrand);
        setWhiteLabelEnabled(agency.white_label_enabled || false);
        setPlatformDisplayName(agency.platform_display_name || "");
        setPlatformLogoUrl(agency.platform_logo_url || null);
        setCustomDomain(agency.custom_domain || "");
        setDomainVerified(agency.custom_domain_verified || false);
        setDomainVerifiedAt(agency.custom_domain_verified_at || null);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      let finalLogoUrl = logoUrl;
      let finalPlatformLogoUrl = platformLogoUrl;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("agency-logos").upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        finalLogoUrl = supabase.storage.from("agency-logos").getPublicUrl(path).data.publicUrl;
      }

      if (platformLogoFile) {
        const ext = platformLogoFile.name.split(".").pop();
        const path = `${userId}/platform-logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("agency-logos").upload(path, platformLogoFile, { upsert: true });
        if (uploadError) throw uploadError;
        finalPlatformLogoUrl = supabase.storage.from("agency-logos").getPublicUrl(path).data.publicUrl;
      }

      const payload = {
        name: agencyName,
        primary_color: primaryColor,
        logo_url: finalLogoUrl,
        notification_email: notificationEmail || null,
        slack_webhook_url: slackWebhookUrl || null,
      };

      if (hasRebrandFeature) {
        payload.white_label_enabled = whiteLabelEnabled;
        payload.platform_display_name = platformDisplayName || null;
        payload.platform_logo_url = finalPlatformLogoUrl;
        payload.custom_domain = customDomain || null;
      }

      const updated = await api.updateAgency(payload);
      setDomainVerified(updated.custom_domain_verified || false);
      setDomainVerifiedAt(updated.custom_domain_verified_at || null);
      setDomainCheckResult(null);

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      setPlatformLogoUrl(finalPlatformLogoUrl);
      setPlatformLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyDomain() {
    setVerifyingDomain(true);
    setDomainCheckResult(null);
    try {
      const result = await api.verifyDomain();
      setDomainCheckResult(result);
      setDomainVerified(result.verified);
      if (result.verified) setDomainVerifiedAt(new Date().toISOString());
    } catch (err) {
      setDomainCheckResult({ verified: false, error: err.message });
    } finally {
      setVerifyingDomain(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 max-w-2xl mx-auto">{t("common.loading")}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <p className="text-gray-500 mt-1">{t("settings.subtitle")}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">{t("settings.branding")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.agencyName")}</label>
            <input
              className="input-field"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.agencyLogo")}</label>
            <div className="flex items-center gap-3">
              {logoUrl && !logoFile && (
                <img src={logoUrl} alt="Agency logo" className="h-10 w-10 rounded-lg object-cover border border-gray-100" />
              )}
              <input
                type="file"
                accept="image/*"
                className="text-sm text-gray-500"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>
            {logoFile && <p className="text-xs text-gray-400 mt-1">{t("settings.selectedFile", { name: logoFile.name })}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.defaultBrandColor")}</label>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{t("settings.notifications")}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t("settings.notificationsHelp")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.notificationEmail")}</label>
            <input
              type="email"
              className="input-field"
              placeholder="alerts@youragency.com"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.slackWebhook")} <span className="font-normal text-gray-400">{t("settings.optional")}</span></label>
            <input
              className="input-field"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhookUrl}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                {t("settings.whiteLabel")}
                {!hasRebrandFeature && <Lock size={13} className="text-gray-400" />}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{t("settings.whiteLabelHelp")}</p>
            </div>
          </div>

          {!hasRebrandFeature ? (
            <div className="rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm px-3 py-2.5">
              {t("settings.enterpriseOnly")}
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whiteLabelEnabled}
                  onChange={(e) => setWhiteLabelEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                {t("settings.enableRebrand")}
              </label>

              {whiteLabelEnabled && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.platformName")}</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Black Rock Reports"
                      value={platformDisplayName}
                      onChange={(e) => setPlatformDisplayName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.appLogo")}</label>
                    <div className="flex items-center gap-3">
                      {platformLogoUrl && !platformLogoFile && (
                        <img src={platformLogoUrl} alt="Platform logo" className="h-10 w-10 rounded-lg object-cover border border-gray-100" />
                      )}
                      <input type="file" accept="image/*" className="text-sm text-gray-500"
                        onChange={(e) => setPlatformLogoFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.customDomain")}</label>
                    <div className="flex gap-2">
                      <input
                        className="input-field flex-1"
                        placeholder="reports.yourcompany.com"
                        value={customDomain}
                        onChange={(e) => { setCustomDomain(e.target.value); setDomainVerified(false); setDomainCheckResult(null); }}
                      />
                      {customDomain && (
                        <button
                          type="button"
                          className="btn-secondary shrink-0 text-sm px-3"
                          onClick={handleVerifyDomain}
                          disabled={verifyingDomain}
                        >
                          {verifyingDomain ? t("settings.checkingDns") : t("settings.verifyDns")}
                        </button>
                      )}
                    </div>

                    {domainVerified ? (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <Check size={12} /> {domainVerifiedAt ? t("settings.verifiedOn", { date: new Date(domainVerifiedAt).toLocaleDateString() }) : t("settings.verified")}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1.5">
                        {t("settings.dnsHelp", { target: "app.rakh.io" })}
                      </p>
                    )}

                    {domainCheckResult && !domainCheckResult.verified && (
                      <p className="text-xs text-red-500 mt-1">{domainCheckResult.error}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> {t("common.saving")}</>
          ) : saved ? (
            <><Check size={16} /> {t("common.saved")}</>
          ) : (
            t("settings.saveSettings")
          )}
        </button>
      </form>
    </div>
  );
}
