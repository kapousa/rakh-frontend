import { useEffect, useState } from "react";
import { ShieldCheck, Pencil, Plus, Loader2, Building2 } from "lucide-react";
import { api } from "../lib/api";

const FEATURE_LABELS = {
  max_reports_per_month: "Max reports / month",
  max_team_members: "Max team members",
  max_clients: "Max clients",
  connected_accounts: "Connect ad accounts",
  auto_sync: "Auto-sync scheduling",
  critical_alerts: "Critical alert notifications",
  public_share_links: "Public share links",
  platform_rebrand: "White-label app rebrand",
  custom_domain: "Custom domain",
};
const NUMERIC_FEATURES = ["max_reports_per_month", "max_team_members", "max_clients"];
const BOOLEAN_FEATURES = [
  "connected_accounts", "auto_sync", "critical_alerts",
  "public_share_links", "platform_rebrand", "custom_domain",
];

function PlanEditor({ plan, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: plan.name,
    monthly_price_usd: plan.monthly_price_usd,
    is_active: plan.is_active,
    features: { ...plan.features },
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="card border-2 border-brand-200">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Plan name</label>
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monthly price (USD)</label>
          <input type="number" className="input-field" value={form.monthly_price_usd}
            onChange={(e) => setForm({ ...form, monthly_price_usd: Number(e.target.value) })} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {NUMERIC_FEATURES.map((key) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{FEATURE_LABELS[key]}</label>
            <input
              type="number"
              className="input-field"
              value={form.features[key]}
              onChange={(e) => setForm({ ...form, features: { ...form.features, [key]: Number(e.target.value) } })}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">-1 = unlimited</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {BOOLEAN_FEATURES.map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm text-gray-700 rounded-lg bg-gray-50 px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.features[key]}
              onChange={(e) => setForm({ ...form, features: { ...form.features, [key]: e.target.checked } })}
              className="h-4 w-4 rounded accent-brand-600"
            />
            {FEATURE_LABELS[key]}
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
        <input type="checkbox" checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="h-4 w-4 rounded accent-brand-600" />
        Plan is active (visible/assignable)
      </label>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Plan"}
        </button>
      </div>
    </div>
  );
}

function AgenciesTab() {
  const [agencies, setAgencies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => Promise.all([api.listAgenciesAdmin(), api.listPlans()])
    .then(([a, p]) => { setAgencies(a); setPlans(p); })
    .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const handlePlanChange = async (agencyId, planId) => {
    await api.assignAgencyPlan(agencyId, planId);
    refresh();
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-5 py-3">Agency</th>
            <th className="text-left px-5 py-3">Current Plan</th>
            <th className="text-left px-5 py-3">Change Plan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {agencies.map((a) => (
            <tr key={a.id}>
              <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" /> {a.name}
              </td>
              <td className="px-5 py-3 text-gray-600">{a.plan_name || "—"}</td>
              <td className="px-5 py-3">
                <select
                  className="input-field py-1 text-xs max-w-[180px]"
                  value={a.plan_id}
                  onChange={(e) => handlePlanChange(a.id, e.target.value)}
                >
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const refresh = () => api.listPlans().then(setPlans).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const handleSave = async (planId, form) => {
    await api.updatePlan(planId, form);
    setEditingId(null);
    refresh();
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        editingId === plan.id ? (
          <PlanEditor
            key={plan.id}
            plan={plan}
            onSave={(form) => handleSave(plan.id, form)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={plan.id} className="card flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <span className="text-xs text-gray-400">${plan.monthly_price_usd}/mo</span>
                {!plan.is_active && <span className="text-xs text-red-500">(inactive)</span>}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {plan.features.max_reports_per_month === -1 ? "Unlimited" : plan.features.max_reports_per_month} reports/mo ·{" "}
                {plan.features.max_clients === -1 ? "Unlimited" : plan.features.max_clients} clients ·{" "}
                {plan.features.max_team_members === -1 ? "Unlimited" : plan.features.max_team_members} team members
                {plan.features.platform_rebrand && " · White-label"}
              </p>
            </div>
            <button onClick={() => setEditingId(plan.id)} className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-600">
              <Pencil size={16} />
            </button>
          </div>
        )
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("plans");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
      </div>
      <p className="text-gray-500 -mt-4">Manage pricing plans and feature access across every agency on the platform.</p>

      <div className="flex gap-1 border-b border-gray-200">
        {[["plans", "Plans & Pricing"], ["agencies", "Agencies"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "plans" ? <PlansTab /> : <AgenciesTab />}
    </div>
  );
}
