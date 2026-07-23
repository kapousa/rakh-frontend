import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, Building2 } from "lucide-react";
import { api } from "../lib/api";
import ConnectionsPanel from "../components/clients/ConnectionsPanel";

const EMPTY_FORM = {
  name: "",
  industry: "",
  contact_email: "",
  brand_primary_color: "#4F46E5",
  brand_secondary_color: "#10B981",
  target_ctr: "",
  target_cpa: "",
  target_roas: "",
  report_cadence_days: "",
  auto_send_reports: false,
  review_window_hours: 24,
};

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchParams, setSearchParams] = useSearchParams();

  const refresh = () => api.listClients().then(setClients).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const connectionId = searchParams.get("connection_id");
  const oauthClientId = searchParams.get("client_id");
  const connectError = searchParams.get("connect_error");
  const pendingAccountPicker = connectionId && oauthClientId ? { connectionId, clientId: oauthClientId } : null;

  const clearOAuthParams = () => {
    searchParams.delete("connected_platform");
    searchParams.delete("connection_id");
    searchParams.delete("client_id");
    searchParams.delete("connect_error");
    setSearchParams(searchParams, { replace: true });
  };

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ ...EMPTY_FORM, ...c }); setEditingId(c.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      target_ctr: form.target_ctr ? Number(form.target_ctr) : null,
      target_cpa: form.target_cpa ? Number(form.target_cpa) : null,
      target_roas: form.target_roas ? Number(form.target_roas) : null,
      report_cadence_days: form.report_cadence_days ? Number(form.report_cadence_days) : null,
    };
    if (editingId) await api.updateClient(editingId, payload);
    else await api.createClient(payload);
    setShowModal(false);
    refresh();
  };

  const handleDelete = async (id) => {
    if (!confirm(t("common.delete") + "?")) return;
    await api.deleteClient(id);
    refresh();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("clients.title")}</h1>
          <p className="text-gray-500 mt-1">{t("clients.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> {t("clients.addClient")}
        </button>
      </div>

      {connectError && (
        <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2 flex items-center justify-between">
          {t("clients.connectError")}
          <button onClick={clearOAuthParams} className="text-red-500 hover:underline">{t("clients.dismiss")}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-gray-400">{t("common.loading")}</p>}
        {clients.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
                  style={{ backgroundColor: c.brand_primary_color }}
                >
                  {c.name?.[0]?.toUpperCase() || <Building2 size={16} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.industry || "—"}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-gray-50 py-2">
                <p className="text-gray-400">{t("clients.ctrShort")}</p>
                <p className="font-semibold text-gray-700">{c.target_ctr ? `${c.target_ctr}%` : "—"}</p>
              </div>
              <div className="rounded-lg bg-gray-50 py-2">
                <p className="text-gray-400">{t("clients.cpaShort")}</p>
                <p className="font-semibold text-gray-700">{c.target_cpa ? `$${c.target_cpa}` : "—"}</p>
              </div>
              <div className="rounded-lg bg-gray-50 py-2">
                <p className="text-gray-400">{t("clients.roasShort")}</p>
                <p className="font-semibold text-gray-700">{c.target_roas ? `${c.target_roas}x` : "—"}</p>
              </div>
            </div>

            <ConnectionsPanel
              clientId={c.id}
              pendingAccountPicker={pendingAccountPicker}
              onAccountPickerHandled={clearOAuthParams}
            />
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? t("clients.editClient") : t("clients.newClient")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder={t("clients.name")} className="input-field"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder={t("clients.industry")} className="input-field"
                value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              <input placeholder={t("clients.contactEmail")} type="email" className="input-field"
                value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500 flex items-center gap-2">
                  {t("clients.primaryColor")}
                  <input type="color" value={form.brand_primary_color}
                    onChange={(e) => setForm({ ...form, brand_primary_color: e.target.value })} />
                </label>
                <label className="text-xs text-gray-500 flex items-center gap-2">
                  {t("clients.secondaryColor")}
                  <input type="color" value={form.brand_secondary_color}
                    onChange={(e) => setForm({ ...form, brand_secondary_color: e.target.value })} />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input placeholder={t("clients.targetCtr")} type="number" step="0.01" className="input-field"
                  value={form.target_ctr} onChange={(e) => setForm({ ...form, target_ctr: e.target.value })} />
                <input placeholder={t("clients.targetCpa")} type="number" step="0.01" className="input-field"
                  value={form.target_cpa} onChange={(e) => setForm({ ...form, target_cpa: e.target.value })} />
                <input placeholder={t("clients.targetRoas")} type="number" step="0.01" className="input-field"
                  value={form.target_roas} onChange={(e) => setForm({ ...form, target_roas: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("clients.reminderCadence")}</label>
                <select
                  className="input-field"
                  value={form.report_cadence_days}
                  onChange={(e) => setForm({ ...form, report_cadence_days: e.target.value })}
                >
                  <option value="">{t("clients.noReminders")}</option>
                  <option value="7">{t("clients.weekly")}</option>
                  <option value="30">{t("clients.monthly")}</option>
                  <option value="90">{t("clients.quarterly")}</option>
                </select>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.auto_send_reports}
                    onChange={(e) => setForm({ ...form, auto_send_reports: e.target.checked })}
                    className="h-4 w-4 rounded accent-brand-600"
                  />
                  {t("clients.autoSendToggle")}
                </label>
                <p className="text-xs text-gray-400 pl-6">{t("clients.autoSendHelp")}</p>
                {form.auto_send_reports && (
                  <div className="pl-6">
                    <label className="block text-xs text-gray-500 mb-1">{t("clients.reviewWindow")}</label>
                    <select
                      className="input-field"
                      value={form.review_window_hours}
                      onChange={(e) => setForm({ ...form, review_window_hours: Number(e.target.value) })}
                    >
                      <option value={1}>1h</option>
                      <option value={6}>6h</option>
                      <option value={24}>24h</option>
                      <option value={72}>72h</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
                <button type="submit" className="btn-primary">{editingId ? t("clients.saveChanges") : t("clients.createClient")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
