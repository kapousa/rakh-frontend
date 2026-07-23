import { getAccessToken } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Thin fetch wrapper that attaches the Supabase JWT and handles JSON/errors. */
async function request(path, { method = "GET", body, isFormData = false, isPublic = false } = {}) {
  const headers = {};
  if (!isPublic) {
    const token = await getAccessToken();
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) return res.blob();
  if (contentType.includes("application/json")) return res.json();
  return res;
}

export const api = {
  // Clients
  listClients: () => request("/api/clients"),
  createClient: (data) => request("/api/clients", { method: "POST", body: data }),
  updateClient: (id, data) => request(`/api/clients/${id}`, { method: "PATCH", body: data }),
  deleteClient: (id) => request(`/api/clients/${id}`, { method: "DELETE" }),

  // Upload & analyze
  analyzeUpload: (formData) => request("/api/upload/analyze", { method: "POST", body: formData, isFormData: true }),

  // Reports
  listReports: () => request("/api/reports"),
  createReport: (data) => request("/api/reports", { method: "POST", body: data }),
  updateReport: (id, data) => request(`/api/reports/${id}`, { method: "PATCH", body: data }),
  updateShareLink: (id, enabled) => request(`/api/reports/${id}/share`, { method: "PATCH", body: { public_share_enabled: enabled } }),
  deleteReport: (id) => request(`/api/reports/${id}`, { method: "DELETE" }),
  exportPdf: (id) => request(`/api/reports/${id}/pdf`),

  // Public (no-login) report viewing
  getPublicReport: (token) => request(`/api/public/reports/${token}`, { isPublic: true }),
  exportPublicPdf: (token) => request(`/api/public/reports/${token}/pdf`, { isPublic: true }),
  getBrandingForDomain: (domain) => request(`/api/public/branding?domain=${encodeURIComponent(domain)}`, { isPublic: true }),

  // Team / agency
  getAgency: () => request("/api/team/agency"),
  updateAgency: (data) => request("/api/team/agency", { method: "PATCH", body: data }),
  verifyDomain: () => request("/api/team/agency/verify-domain", { method: "POST" }),
  listMembers: () => request("/api/team/members"),
  inviteMember: (data) => request("/api/team/members/invite", { method: "POST", body: data }),
  updateMemberRole: (id, role) => request(`/api/team/members/${id}`, { method: "PATCH", body: { role } }),
  removeMember: (id) => request(`/api/team/members/${id}`, { method: "DELETE" }),

  // Ad platform integrations
  getConnectUrl: (platform, clientId) => request(`/api/integrations/connect/${platform}?client_id=${clientId}`),
  listConnections: (clientId) => request(`/api/integrations/connections?client_id=${clientId}`),
  getConnectionAccounts: (connectionId) => request(`/api/integrations/connections/${connectionId}/accounts`),
  selectAccount: (connectionId, data) => request(`/api/integrations/connections/${connectionId}/select-account`, { method: "POST", body: data }),
  updateConnection: (connectionId, data) => request(`/api/integrations/connections/${connectionId}`, { method: "PATCH", body: data }),
  disconnectConnection: (connectionId) => request(`/api/integrations/connections/${connectionId}`, { method: "DELETE" }),
  syncNow: (connectionId) => request(`/api/integrations/connections/${connectionId}/sync-now`, { method: "POST" }),
  previewConnectionPull: (connectionId, data) => request(`/api/integrations/connections/${connectionId}/preview`, { method: "POST", body: data }),
  reviewReport: (reportId, action) => request(`/api/integrations/reports/${reportId}/review`, { method: "PATCH", body: { action } }),

  // Platform admin (super-admin dashboard)
  checkPlatformAdmin: () => request("/api/admin/me"),
  listPlans: () => request("/api/admin/plans"),
  createPlan: (data) => request("/api/admin/plans", { method: "POST", body: data }),
  updatePlan: (id, data) => request(`/api/admin/plans/${id}`, { method: "PATCH", body: data }),
  deletePlan: (id) => request(`/api/admin/plans/${id}`, { method: "DELETE" }),
  listAgenciesAdmin: () => request("/api/admin/agencies"),
  assignAgencyPlan: (agencyId, planId) => request(`/api/admin/agencies/${agencyId}/plan`, { method: "PATCH", body: { plan_id: planId } }),
};
