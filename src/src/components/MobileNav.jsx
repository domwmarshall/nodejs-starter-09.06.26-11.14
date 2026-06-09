import { Lock } from "lucide-react";

export function MobileNav({ modules, activePage, onNavigate }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = activePage === module.id;
        const isDisabled = module.enabled === false;

        return (
          <button
            key={module.id}
            type="button"
            className={[
              isActive ? "mobile-active" : "",
              isDisabled ? "mobile-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onNavigate(module.id)}
            title={isDisabled ? module.lockReason || `${module.name} is unavailable` : module.name}
            aria-current={isActive ? "page" : undefined}
          >
            {isDisabled ? <Lock size={15} /> : <Icon size={16} />}
            <span>{module.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
