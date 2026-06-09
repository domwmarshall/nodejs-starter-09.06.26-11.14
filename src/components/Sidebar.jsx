export function Sidebar({ modules, activePage, onNavigate }) {
  const visibleModules = modules.filter((module) => module.enabled !== false);

  return (
    <aside className="sidebar sidebar-refined" aria-label="Module navigation">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">G</div>
        <div>
          <p>GPOP</p>
          <h1>Operations Portal</h1>
          <small>Fleggburgh Surgery</small>
        </div>
      </div>

      <nav className="nav-list nav-list-flat" aria-label="Primary navigation">
        {visibleModules.map((module) => {
          const Icon = module.icon;
          const isActive = activePage === module.id;

          return (
            <button
              key={module.id}
              type="button"
              className={["nav-item", isActive ? "nav-item-active" : ""].filter(Boolean).join(" ")}
              onClick={() => onNavigate(module.id)}
              title={module.name}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="nav-icon"><Icon size={17} /></span>
              <span>{module.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
