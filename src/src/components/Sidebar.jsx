import { AlertTriangle, Lock, Search } from "lucide-react";

const navGroups = [
  {
    label: "Operate",
    ids: ["dashboard", "inbox"],
  },
  {
    label: "Workforce",
    ids: ["staff", "calendar"],
  },
  {
    label: "Governance",
    ids: ["compliance", "training", "audits", "care-navigation"],
  },
  {
    label: "Commercial",
    ids: ["finance"],
  },
  {
    label: "Admin",
    ids: ["settings"],
  },
];

function getGroupedModules(modules) {
  return navGroups
    .map((group) => ({
      ...group,
      modules: group.ids
        .map((id) => modules.find((module) => module.id === id))
        .filter(Boolean),
    }))
    .filter((group) => group.modules.length > 0);
}

export function Sidebar({ modules, activePage, onNavigate }) {
  const groupedModules = getGroupedModules(modules);

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">G</div>
        <div>
          <p>GPOP</p>
          <h1>General Practice Operations Portal</h1>
          <small>Fleggburgh Surgery</small>
        </div>
      </div>

      <div className="sidebar-search" aria-label="Search placeholder">
        <Search size={16} />
        <span>Search modules...</span>
        <kbd>⌘ K</kbd>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {groupedModules.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>

            {group.modules.map((module) => {
              const Icon = module.icon;
              const isActive = activePage === module.id;
              const isDisabled = module.enabled === false;

              return (
                <button
                  key={module.id}
                  type="button"
                  className={[
                    "nav-item",
                    isActive ? "nav-item-active" : "",
                    isDisabled ? "nav-item-disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onNavigate(module.id)}
                  title={
                    isDisabled
                      ? module.lockReason || `${module.name} is unavailable`
                      : module.name
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-icon"><Icon size={17} /></span>
                  <span>{module.name}</span>
                  {isDisabled ? <Lock size={13} className="nav-lock" /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-warning">
        <AlertTriangle size={16} />
        <p>
          <strong>Prototype mode</strong>
          <span>No patient-identifiable data.</span>
        </p>
      </div>
    </aside>
  );
}
