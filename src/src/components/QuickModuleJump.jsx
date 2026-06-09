import { Search } from "lucide-react";

export function QuickModuleJump({ modules, activePage, onNavigate }) {
  return (
    <label className="quick-module-jump">
      <Search size={15} />
      <span>Jump</span>
      <select
        value={activePage}
        onChange={(event) => onNavigate(event.target.value)}
        aria-label="Jump to module"
      >
        {modules.map((module) => (
          <option key={module.id} value={module.id}>
            {module.enabled === false ? "Locked · " : ""}
            {module.name}
          </option>
        ))}
      </select>
    </label>
  );
}
