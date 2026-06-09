import { Database, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "./Badge";

export function SyncStatusBanner({ status = {}, moduleName = "Module", children }) {
  const source = status.source || "localStorage";
  const isSupabase = source === "Supabase";
  const toneClass = isSupabase ? "sync-status-banner-db" : "sync-status-banner-local";
  const Icon = isSupabase ? Database : RefreshCw;

  return (
    <section className={["sync-status-banner", toneClass].join(" ")}>
      <div className="sync-status-icon"><Icon size={18} /></div>
      <div className="sync-status-copy">
        <span>{moduleName} data source</span>
        <strong>{isSupabase ? "Loaded from Supabase capacity backbone" : "Using local browser fallback"}</strong>
        <p>{status.message || (isSupabase ? "Staff, rooms and capacity can now be checked against the seeded database." : "Seed Supabase from Access to make this module practice-scoped and shareable.")}</p>
        {children}
      </div>
      <Badge>{isSupabase ? "DB-backed" : "Local"}</Badge>
      {isSupabase ? <ShieldCheck className="sync-status-check" size={18} /> : null}
    </section>
  );
}
