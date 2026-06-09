import { appUsers, defaultAppUserId } from "../data/users";

export const ACTIVE_USER_STORAGE_KEY = "gpop-active-user-id";

const NO_ACCESS_LABELS = new Set(["No access", "None", "Blocked"]);

export function getDefaultAppUser() {
  return appUsers.find((user) => user.id === defaultAppUserId) || appUsers[0];
}

export function getAppUserById(userId) {
  return appUsers.find((user) => user.id === userId) || getDefaultAppUser();
}

export function getModuleAccessForUser(user, moduleId) {
  return user?.moduleAccess?.[moduleId] || "No access";
}

export function userCanAccessModule(user, moduleId) {
  return !NO_ACCESS_LABELS.has(getModuleAccessForUser(user, moduleId));
}

export function applyUserAccessToModules(modules = [], user = getDefaultAppUser()) {
  return modules.map((module) => {
    const roleAccess = getModuleAccessForUser(user, module.id);
    const roleLocked = !userCanAccessModule(user, module.id);

    return {
      ...module,
      roleAccess,
      roleLocked,
      enabled: module.enabled !== false && !roleLocked,
      lockReason: roleLocked
        ? `${user.role} does not have access to ${module.name}`
        : module.enabled === false
          ? `${module.name} is switched off in Settings`
          : "",
    };
  });
}

export function getUserAccessSummary(user = getDefaultAppUser()) {
  const entries = Object.entries(user.moduleAccess || {});
  const accessibleModules = entries.filter(([, access]) => !NO_ACCESS_LABELS.has(access));
  const noAccessModules = entries.filter(([, access]) => NO_ACCESS_LABELS.has(access));

  return {
    accessibleCount: accessibleModules.length,
    noAccessCount: noAccessModules.length,
    accessibleModules,
    noAccessModules,
  };
}

export function getRoleHomeSummary(user = getDefaultAppUser()) {
  if (user.role === "Practice Manager") {
    return "Management view: approvals, workforce cover, finance, compliance, training and production readiness.";
  }

  if (user.role === "GP Partner") {
    return "Leadership view: clinical governance, finance visibility, care navigation approval and operational risk.";
  }

  if (user.role.includes("Reception")) {
    return "Reception view: inbox, own training, policy acknowledgements, calendar visibility and care navigation.";
  }

  if (user.role.includes("Nurse")) {
    return "Nursing view: assigned audits, training renewals, policy acknowledgements and calendar visibility.";
  }

  if (user.role.includes("Dispenser") || user.role.includes("Pharmacist")) {
    return "Dispensary view: pharmacy tasks, training, policy acknowledgements and dispensary finance visibility.";
  }

  return "Role-based dashboard view.";
}

export function userOwnsStaffRecord(user, staffName) {
  return user?.name === staffName;
}
