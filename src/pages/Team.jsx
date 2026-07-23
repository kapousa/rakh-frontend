import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { api } from "../lib/api";
import { useBranding } from "../lib/useBranding";
import Badge from "../components/ui/Badge";

const ROLE_OPTIONS = ["member", "admin", "owner"];

export default function Team() {
  const { t } = useTranslation();
  const branding = useBranding();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null);

  const refresh = () => api.listMembers().then(setMembers).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await api.inviteMember({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setShowInvite(false);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    await api.updateMemberRole(id, role);
    refresh();
  };

  const handleRemove = async (id) => {
    if (!confirm(t("common.delete") + "?")) return;
    await api.removeMember(id);
    refresh();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("team.title")}</h1>
          <p className="text-gray-500 mt-1">{t("team.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowInvite(true)}>
          <UserPlus size={16} /> {t("team.inviteMember")}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">{t("team.email")}</th>
              <th className="text-left px-5 py-3">{t("team.role")}</th>
              <th className="text-left px-5 py-3">{t("team.status")}</th>
              <th className="text-right px-5 py-3">{t("team.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400">{t("common.loading")}</td></tr>}
            {!loading && members.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400">{t("team.noMembers")}</td></tr>
            )}
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3 text-gray-900">{m.invited_email || "—"}</td>
                <td className="px-5 py-3">
                  <select
                    className="input-field py-1 text-xs"
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={m.status === "active" ? "success" : "warning"}>{m.status}</Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleRemove(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("team.inviteTitle")}</h2>
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="email" required placeholder="colleague@agency.com" className="input-field"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              />
              <select className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <p className="text-xs text-gray-400">
                {t("team.inviteHelp", { productName: branding.productName })}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowInvite(false)}>{t("common.cancel")}</button>
                <button type="submit" className="btn-primary" disabled={inviting}>
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {t("team.invite")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
