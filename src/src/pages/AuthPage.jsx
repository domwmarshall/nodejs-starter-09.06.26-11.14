import { Building2, ShieldCheck, UserPlus } from "lucide-react";
import { Badge } from "../components/Badge";
import { PageHeader, Panel } from "../components/ui";

export function AuthPage({ currentUser }) {
  return (
    <>
      <PageHeader eyebrow="Access" title="Sign-in and practice access">
        Supabase Auth scaffold for sign-up, practice membership, invite codes and role assignment.
      </PageHeader>

      <section className="premium-insight-grid">
        <Panel className="premium-card premium-card-compact">
          <div className="premium-card-header">
            <div>
              <span>Current demo role</span>
              <h3>{currentUser?.role || "Practice Manager"}</h3>
            </div>
            <Badge>Prototype</Badge>
          </div>
          <div className="premium-insight-list">
            <article className="premium-insight-row">
              <div className="premium-insight-icon"><ShieldCheck size={17} /></div>
              <div>
                <strong>Role-based access planned</strong>
                <span>Production records must be scoped by practice membership and RLS.</span>
              </div>
            </article>
          </div>
        </Panel>

        <Panel className="premium-insight-card">
          <div className="premium-insight-card-icon"><UserPlus size={18} /></div>
          <div>
            <span>Next</span>
            <strong>Invite users</strong>
            <p>Practice admins will invite staff, approve joins and assign roles.</p>
          </div>
        </Panel>

        <Panel className="premium-insight-card">
          <div className="premium-insight-card-icon"><Building2 size={18} /></div>
          <div>
            <span>Tenant model</span>
            <strong>Practice scoped</strong>
            <p>Each operational table should include practice_id, created_by and updated_by.</p>
          </div>
        </Panel>
      </section>
    </>
  );
}
