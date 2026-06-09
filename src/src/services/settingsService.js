import { practiceSettings } from "../data/settings";
import { clearStorageKeys, readStorage, writeStorage } from "./storageService";
import { ACTIVITY_LOG_STORAGE_KEY } from "./activityLogService";

export const SETTINGS_STORAGE_KEYS = {
  holidayRequests: "gpop-holiday-requests",
  inboxItems: "gpop-inbox-items",
  auditTemplates: "gpop-audit-templates",
  auditSubmissions: "gpop-audit-submissions",
  moduleSettings: "gpop-module-settings",
  financeTasks: "gpop-finance-tasks",
  dispensaryInvoiceLines: "gpop-dispensary-invoice-lines",
  compliancePolicies: "gpop-compliance-policies",
  complianceAcknowledgements: "gpop-compliance-acknowledgements",
  complianceQuestions: "gpop-compliance-questions",
  trainingCourses: "gpop-training-courses",
  trainingRecords: "gpop-training-records",
  careNavigationPathways: "gpop-care-navigation-pathways",
  careNavigationNotes: "gpop-care-navigation-notes",
  workforceProfiles: "gpop-workforce-profiles",
  activeUser: "gpop-active-user",
  appConfig: "gpop-app-config",
  activityLog: ACTIVITY_LOG_STORAGE_KEY,
};

export const ALL_GPOP_STORAGE_KEYS = Object.values(SETTINGS_STORAGE_KEYS);

export const DEFAULT_APP_CONFIG = {
  practiceName: practiceSettings.practiceName,
  systemName: practiceSettings.systemName,
  systemFullName: practiceSettings.systemFullName,
  holidayYearStart: practiceSettings.holidayYearStart,
  holidayYearEnd: practiceSettings.holidayYearEnd,
  dataMode: practiceSettings.dataMode,
  adminContact: "Dominic Marshall - Practice Manager",
  prototypeWarning:
    "Prototype only. Do not upload patient-identifiable data or use for real clinical decisions.",
};

export function getAppConfig() {
  return readStorage(SETTINGS_STORAGE_KEYS.appConfig, DEFAULT_APP_CONFIG);
}

export function saveAppConfig(appConfig) {
  return writeStorage(SETTINGS_STORAGE_KEYS.appConfig, appConfig);
}

export function resetAppConfig() {
  return writeStorage(SETTINGS_STORAGE_KEYS.appConfig, DEFAULT_APP_CONFIG);
}

export function clearAllDemoData() {
  clearStorageKeys(ALL_GPOP_STORAGE_KEYS);
}
