import { useEffect, useState } from "react";
import { api } from "./api";

export const DEFAULT_BRANDING = {
  productName: "RAKH",
  logoUrl: null, // null = use the built-in gradient mark, not an uploaded image
  faviconUrl: null,
};

/**
 * Resolves branding in priority order:
 *   1. An authenticated agency's white-label settings (Enterprise plan,
 *      applies inside the logged-in app regardless of domain)
 *   2. A custom-domain lookup (applies even on the pre-login screen, for
 *      visitors arriving via a reseller's own domain)
 *   3. Default RAKH branding
 *
 * `agency` is optional — pass it once you have it from api.getAgency() in
 * an authenticated screen (see AppShell.jsx). Public/pre-login screens
 * (see Login.jsx) call this with no agency and rely on the domain lookup.
 */
export function useBranding(agency = null) {
  const [domainBranding, setDomainBranding] = useState(null);

  useEffect(() => {
    if (agency?.white_label_enabled) return; // already have authoritative branding, skip the lookup
    api.getBrandingForDomain(window.location.hostname)
      .then((res) => { if (res.white_label_enabled) setDomainBranding(res); })
      .catch(() => {}); // default domain / no match is the normal case, fail silently
  }, [agency]);

  if (agency?.white_label_enabled) {
    return {
      productName: agency.platform_display_name || DEFAULT_BRANDING.productName,
      logoUrl: agency.platform_logo_url || null,
      faviconUrl: agency.platform_favicon_url || null,
    };
  }

  if (domainBranding) {
    return {
      productName: domainBranding.platform_display_name || DEFAULT_BRANDING.productName,
      logoUrl: domainBranding.platform_logo_url || null,
      faviconUrl: domainBranding.platform_favicon_url || null,
    };
  }

  return DEFAULT_BRANDING;
}
