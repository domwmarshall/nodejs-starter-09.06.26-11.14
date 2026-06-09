import { featureFlags, roleDashboardPresets } from "../data/featureFlags";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const FEATURE_FLAGS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.featureFlags;

export function getDefaultFeatureFlags() {
  return featureFlags;
}

export function getRoleDashboardPresets() {
  return roleDashboardPresets;
}

export function mergeFeatureFlags(currentFlags = [], defaults = featureFlags) {
  const safeCurrent = Array.isArray(currentFlags) ? currentFlags : [];
  return defaults.map((defaultFlag) => ({
    ...defaultFlag,
    ...(safeCurrent.find((flag) => flag.id === defaultFlag.id) || {}),
  }));
}

export function isFeatureEnabled(flags, flagId) {
  const merged = mergeFeatureFlags(flags);
  const flag = merged.find((item) => item.id === flagId);
  return flag ? flag.enabled !== false : false;
}

export function toggleFeatureFlag(flags, flagId) {
  return mergeFeatureFlags(flags).map((flag) =>
    flag.id === flagId ? { ...flag, enabled: !flag.enabled } : flag
  );
}

export function getFeatureFlagMetrics(flags = featureFlags) {
  const merged = mergeFeatureFlags(flags);
  return {
    total: merged.length,
    enabled: merged.filter((flag) => flag.enabled).length,
    disabled: merged.filter((flag) => !flag.enabled).length,
    highRiskEnabled: merged.filter((flag) => flag.enabled && flag.risk === "High").length,
  };
}
