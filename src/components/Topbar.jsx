import { Badge } from "./Badge";
import { UserSwitcher } from "./UserSwitcher";

export function Topbar({
  activeModule,
  users,
  activeUser,
  onUserChange,
}) {
  return (
    <header className="topbar">
      <div className="topbar-title-block">
        <p className="topbar-label">Workspace</p>
        <h2>{activeModule.name}</h2>
      </div>

      <div className="topbar-actions">
        <UserSwitcher
          users={users}
          activeUser={activeUser}
          onChange={onUserChange}
        />
        <div className="topbar-badges">
          <Badge>{activeModule.status || "Active"}</Badge>
        </div>
      </div>
    </header>
  );
}
