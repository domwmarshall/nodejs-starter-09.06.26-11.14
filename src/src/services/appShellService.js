import { modules } from "../data/modules";
import { moduleSettings } from "../data/settings";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const MODULE_SETTINGS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.moduleSettings;

export function mergeModuleToggleSettings(savedSettings = [], defaults = moduleSettings) {
  const safeSavedSettings = Array.isArray(savedSettings) ? savedSettings : [];

  return defaults.map((defaultModule) => {
    const savedModule = safeSavedSettings.find(
      (item) => item.id === defaultModule.id
    );

    return {
      ...defaultModule,
      ...savedModule,
      enabled:
        typeof savedModule?.enabled === "boolean"
          ? savedModule.enabled
          : defaultModule.enabled,
    };
  });
}

export function applyToggleStateToModules(appModules = modules, toggleSettings = moduleSettings) {
  const safeToggleSettings = Array.isArray(toggleSettings)
    ? toggleSettings
    : moduleSettings;

  return appModules.map((module) => {
    const setting = safeToggleSettings.find((item) => item.id === module.id);

    return {
      ...module,
      enabled: setting ? setting.enabled : true,
      governanceStatus: setting?.governanceStatus || module.status,
      dataRisk: setting?.dataRisk || module.risk,
    };
  });
}

export function getActiveModule(modulesWithState = modules, activePage = "dashboard") {
  const safeModules = Array.isArray(modulesWithState) ? modulesWithState : modules;

  return (
    safeModules.find((module) => module.id === activePage) ||
    safeModules.find((module) => module.id === "dashboard") ||
    safeModules[0]
  );
}

export function getModuleSetting(toggleSettings = moduleSettings, moduleId) {
  const safeToggleSettings = Array.isArray(toggleSettings)
    ? toggleSettings
    : moduleSettings;

  return safeToggleSettings.find((item) => item.id === moduleId);
}

export function getAppShellMetrics(modulesWithState = modules) {
  const safeModules = Array.isArray(modulesWithState) ? modulesWithState : modules;

  const enabledModules = safeModules.filter((module) => module.enabled !== false);
  const disabledModules = safeModules.filter(
    (module) => module.enabled === false && module.id !== "settings"
  );
  const highRiskModules = safeModules.filter((module) => module.risk === "High");
  const mediumRiskModules = safeModules.filter((module) => module.risk === "Medium");

  return {
    totalModules: safeModules.length,
    enabledModules,
    disabledModules,
    highRiskModules,
    mediumRiskModules,
    disabledCount: disabledModules.length,
    enabledCount: enabledModules.length,
    highRiskCount: highRiskModules.length,
  };
}
