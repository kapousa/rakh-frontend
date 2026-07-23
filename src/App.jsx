import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import ReportWizard from "./pages/ReportWizard";
import Reports from "./pages/Reports";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import PublicReport from "./pages/PublicReport";
import AdminDashboard from "./pages/AdminDashboard";
import RequirePlatformAdmin from "./components/layout/RequirePlatformAdmin";

function useSession() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return session;
}

export default function App() {
  const session = useSession();

  // Public, no-login share links must work regardless of auth state —
  // check this route first, before gating on session.
  return (
    <Routes>
      <Route path="/share/:token" element={<PublicReport />} />
      <Route path="*" element={<AuthenticatedApp session={session} />} />
    </Routes>
  );
}

function AuthenticatedApp({ session }) {
  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports/new" element={<ReportWizard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/admin"
          element={
            <RequirePlatformAdmin>
              <AdminDashboard />
            </RequirePlatformAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
