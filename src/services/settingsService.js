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
  documents: "gpop-documents",
  authSession: "gpop-auth-session",
  practiceMemberships: "gpop-practice-memberships",
  featureFlags: "gpop-feature-flags",
  dashboardPreferences: "gpop-dashboard-preferences",
  rotaShifts: "gpop-rota-shifts",
  fridgeReadings: "gpop-fridge-readings",
  fridgeAcknowledgements: "gpop-fridge-acknowledgements",
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
  workspaceNotice:
    "Workspace configuration is saved locally until database-backed practice settings are enabled.",
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
