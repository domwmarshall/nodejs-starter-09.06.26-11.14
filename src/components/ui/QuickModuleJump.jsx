import { Search } from "lucide-react";

export function QuickModuleJump({ modules, activePage, onNavigate }) {
  return (
    <label className="quick-module-jump">
      <Search size={16} />
      <span>Jump to</span>
      <select
        value={activePage}
        onChange={(event) => onNavigate(event.target.value)}
        aria-label="Jump to module"
      >
        {modules.map((module) => (
          <option key={module.id} value={module.id}>
            {module.enabled === false && module.id !== "settings" ? "🔒 " : ""}
            {module.name}
          </option>
        ))}
      </select>
    </label>
  );
}
