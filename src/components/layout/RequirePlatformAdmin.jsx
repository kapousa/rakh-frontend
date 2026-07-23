import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/api";

/**
 * Wraps a route that should only be reachable by platform admins. The
 * backend already rejects non-admin requests to /api/admin/* (403), but
 * without this guard a non-admin who navigates to /admin directly would
 * still see the page shell and a wall of failed-request error states
 * instead of being redirected away cleanly.
 */
export default function RequirePlatformAdmin({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "denied"

  useEffect(() => {
    api.checkPlatformAdmin()
      .then((res) => setStatus(res.is_platform_admin ? "allowed" : "denied"))
      .catch(() => setStatus("denied")); // fail closed — any error means no access
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return children;
}
