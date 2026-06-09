import { Badge } from "./Badge";
import { QuickModuleJump } from "./QuickModuleJump";
import { UserSwitcher } from "./UserSwitcher";

export function Topbar({
  activeModule,
  modules,
  activePage,
  onNavigate,
  users,
  activeUser,
  onUserChange,
}) {
  return (
    <header className="topbar">
      <div className="topbar-title-block">
        <p className="topbar-label">GPOP</p>
        <h2>{activeModule.name}</h2>
      </div>

      <div className="topbar-actions">
        <UserSwitcher
          users={users}
          activeUser={activeUser}
          onChange={onUserChange}
        />
        <QuickModuleJump
          modules={modules}
          activePage={activePage}
          onNavigate={onNavigate}
        />
        <div className="topbar-badges">
          <Badge>{activeModule.enabled === false ? "Unavailable" : activeModule.status}</Badge>
        </div>
      </div>
    </header>
  );
}
