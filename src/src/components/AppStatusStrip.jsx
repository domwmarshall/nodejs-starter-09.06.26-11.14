import { useEffect, useState } from "react";
import { Database, ShieldCheck } from "lucide-react";

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
    <section className="app-status-strip" aria-label="Application status summary">
      <div className="app-status-compact-main">
        <ShieldCheck size={16} />
        <strong>Prototype workspace</strong>
        <span>Dummy data · {activeUser.role} · {metrics.enabledCount}/{metrics.totalModules} modules</span>
      </div>

      <div className="app-status-compact-db">
        <Database size={16} />
        <span>{databaseStatus.status === "connected" ? "Audit log live" : databaseStatus.label}</span>
      </div>
    </section>
  );
}
