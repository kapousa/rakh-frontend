import { useEffect, useState } from "react";
import { Link2, RefreshCw, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";

const PLATFORM_META = {
  google: { label: "Google Ads", color: "bg-gradient-to-br from-amber-400 to-red-500" },
  meta: { label: "Meta Ads", color: "bg-gradient-to-br from-blue-500 to-indigo-500" },
  tiktok: { label: "TikTok Ads", color: "bg-gradient-to-br from-slate-700 to-slate-900" },
};
const AVAILABLE_PLATFORMS = ["google", "meta", "tiktok"];

export default function ConnectionsPanel({ clientId, pendingAccountPicker, onAccountPickerHandled }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [pickerAccounts, setPickerAccounts] = useState(null);
  const [pickerConnectionId, setPickerConnectionId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = () => api.listConnections(clientId).then(setConnections).catch((e) => setError(e.message)).finally(() => setLoading(false));

  useEffect(() => { refresh(); }, [clientId]);

  // If we just landed back from an OAuth redirect for this client, open the account picker.
  useEffect(() => {
    if (pendingAccountPicker?.clientId === clientId) {
      api.getConnectionAccounts(pendingAccountPicker.connectionId)
        .then((accounts) => {
          setPickerAccounts(accounts);
          setPickerConnectionId(pendingAccountPicker.connectionId);
        })
        .catch((e) => setError(e.message))
        .finally(() => onAccountPickerHandled?.());
    }
  }, [pendingAccountPicker, clientId]);

  const handleConnect = async (platform) => {
    setConnecting(platform);
    setError(null);
    try {
      const { oauth_url } = await api.getConnectUrl(platform, clientId);
      window.location.href = oauth_url; // full navigation — OAuth consent screens can't live in an iframe/fetch
    } catch (e) {
      setError(e.message);
      setConnecting(null);
    }
  };

  const handleSelectAccount = async (account) => {
    await api.selectAccount(pickerConnectionId, {
      external_account_id: account.external_id,
      external_account_name: account.name,
    });
    setPickerAccounts(null);
    setPickerConnectionId(null);
    refresh();
  };

  const handleSyncNow = async (connectionId) => {
    setError(null);
    try {
      await api.syncNow(connectionId);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!confirm("Disconnect this platform? Scheduled auto-syncs will stop.")) return;
    await api.disconnectConnection(connectionId);
    refresh();
  };

  const connectedPlatforms = new Set(connections.map((c) => c.platform));

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-2">Auto-pull connections</p>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <div className="space-y-2">
        {connections.map((conn) => {
          const meta = PLATFORM_META[conn.platform];
          return (
            <div key={conn.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded ${meta.color}`} />
                <div>
                  <p className="text-xs font-medium text-gray-800">{meta.label}</p>
                  <p className="text-[11px] text-gray-400">
                    {conn.external_account_name || "No account selected"}
                    {conn.last_synced_at && ` · synced ${new Date(conn.last_synced_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {conn.last_sync_status === "success" && <CheckCircle2 size={13} className="text-emerald-500" />}
                {conn.last_sync_status === "failed" && <AlertCircle size={13} className="text-red-500" title={conn.last_sync_error} />}
                {conn.sync_enabled && (
                  <button onClick={() => handleSyncNow(conn.id)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-brand-600" title="Sync now">
                    <RefreshCw size={13} />
                  </button>
                )}
                <button onClick={() => handleDisconnect(conn.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500" title="Disconnect">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {AVAILABLE_PLATFORMS.filter((p) => !connectedPlatforms.has(p)).map((platform) => {
          const meta = PLATFORM_META[platform];
          return (
            <button
              key={platform}
              disabled={connecting === platform}
              onClick={() => handleConnect(platform)}
              className="w-full flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-3 py-2 text-left hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded ${meta.color} opacity-60`} />
                <p className="text-xs font-medium text-gray-600">Connect {meta.label}</p>
              </div>
              {connecting === platform ? (
                <Loader2 size={13} className="animate-spin text-gray-400" />
              ) : (
                <Link2 size={13} className="text-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      {pickerAccounts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Select an ad account</h3>
            <p className="text-xs text-gray-400 mb-4">Choose which account maps to this client.</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {pickerAccounts.length === 0 && (
                <p className="text-xs text-gray-400">No accessible ad accounts found for this login.</p>
              )}
              {pickerAccounts.map((acc) => (
                <button
                  key={acc.external_id}
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full text-left rounded-lg border border-gray-100 px-3 py-2 text-sm hover:border-brand-300 hover:bg-brand-50"
                >
                  <p className="font-medium text-gray-800">{acc.name}</p>
                  <p className="text-[11px] text-gray-400">{acc.external_id}</p>
                </button>
              ))}
            </div>
            <button
              className="btn-secondary w-full mt-4"
              onClick={() => { setPickerAccounts(null); setPickerConnectionId(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
