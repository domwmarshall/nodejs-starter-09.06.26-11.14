import { getModuleTheme } from '../../theme/moduleThemes';

export function ModuleIconBadge({ moduleName, icon: Icon }) {
  const theme = getModuleTheme(moduleName);

  return (
    <span
      className="module-icon-badge"
      style={{
        '--module-colour': theme.color,
        '--module-soft': theme.soft,
      }}
    >
      {Icon ? <Icon size={17} /> : null}
    </span>
  );
}
