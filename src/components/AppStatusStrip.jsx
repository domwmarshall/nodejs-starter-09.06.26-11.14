import { useEffect, useState } from "react";
import { Database } from "lucide-react";

import { getSupabaseConnectionStatus } from "../services/supabaseClient";

export function AppStatusStrip({ metrics, activeUser }) {
  const [databaseStatus, setDatabaseStatus] = useState({
    label: "Checking database",
    status: "checking",
  });

  useEffect(() => {
    let isMounted = true;

    getSupabaseConnectionStatus().then((status) => {
      if (isMounted) setDatabaseStatus(status);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="app-status-strip app-status-strip-minimal" aria-label="Application status summary">
      <span>{activeUser.role}</span>
      <span>{metrics.enabledCount}/{metrics.totalModules} modules</span>
      <span className="app-status-compact-db"><Database size={13} /> {databaseStatus.status === "connected" ? "Audit log live" : databaseStatus.label}</span>
    </section>
  );
}
