export function MobileNav({ modules, activePage, onNavigate }) {
  const visibleModules = modules.filter((module) => module.enabled !== false).slice(0, 6);

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {visibleModules.map((module) => {
        const Icon = module.icon;
        const isActive = activePage === module.id;

        return (
          <button
            key={module.id}
            type="button"
            className={isActive ? "mobile-active" : ""}
            onClick={() => onNavigate(module.id)}
            title={module.name}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={16} />
            <span>{module.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
