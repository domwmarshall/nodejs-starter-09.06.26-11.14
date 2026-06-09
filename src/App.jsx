import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Lock } from "lucide-react";

import { AppStatusStrip } from "./components/AppStatusStrip";
import { SectionHeader } from "./components/SectionHeader";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { MobileNav } from "./components/MobileNav";
import { modules } from "./data/modules";
import { moduleSettings } from "./data/settings";
import { appUsers } from "./data/users";
import { useLocalStorageState } from "./hooks/useLocalStorageState";

import { DashboardPage } from "./pages/DashboardPage";
import { StaffPage } from "./pages/StaffPage";
import { CalendarPage } from "./pages/CalendarPage";
import { InboxPage } from "./pages/InboxPage";
import { CompliancePage } from "./pages/CompliancePage";
import { TrainingPage } from "./pages/TrainingPage";
import { AuditsPage } from "./pages/AuditsPage";
import { FinancePage } from "./pages/FinancePage";
import { CareNavigationPage } from "./pages/CareNavigationPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { AuthPage } from "./pages/AuthPage";
import { SettingsPage } from "./pages/SettingsPage";

import {
  STAFF_LEAVE_STORAGE_KEY,
  getDefaultHolidayRequests,
  addHolidayRequest as addHolidayRequestToList,
  updateHolidayRequestStatus as updateHolidayRequestStatusInList,
} from "./services/staffService";

import {
  MODULE_SETTINGS_STORAGE_KEY,
  applyToggleStateToModules,
  getActiveModule,
  getAppShellMetrics,
  getModuleSetting,
  mergeModuleToggleSettings,
} from "./services/appShellService";

import {
  ACTIVE_USER_STORAGE_KEY,
  applyUserAccessToModules,
  getAppUserById,
  getDefaultAppUser,
} from "./services/userService";

import {
  WORKFORCE_PROFILES_STORAGE_KEY,
  addContractAmendment as addContractAmendmentToProfiles,
  addStaffProfile as addStaffProfileToProfiles,
  updateStaffProfile as updateStaffProfileInList,
  getSafeWorkforceProfiles,
  getDefaultWorkforceProfiles,
} from "./services/workforceService";

import {
  Button,
  Panel,
} from "./components/ui";

import { logActivity } from "./services/activityLogService";
import { fetchWorkforceProfilesFromSupabase, isCapacityBackboneAvailable } from "./services/capacityBackboneService";

import "./style.css";

function DisabledModulePage({ module, activeUser, onOpenSettings }) {
  const isRoleLocked = module.roleLocked === true;

  return (
    <>
      <section className="disabled-module-panel">
        <div className="disabled-module-icon">
          <Lock size={28} />
        </div>

        <div>
          <p className="eyebrow">
            {isRoleLocked ? "Role access restricted" : "Module disabled"}
          </p>
          <h1>{module.name} is currently unavailable</h1>
          <p>
            {isRoleLocked
              ? `${activeUser.role} does not have access to this module with the current role permissions. Switch back to Practice Manager to manage all areas.`
              : "This module has been disabled in Settings. In a production version, this would be controlled by administrator permissions and practice configuration."}
          </p>
        </div>
      </section>

      <Panel className="panel">
        <SectionHeader
          eyebrow={isRoleLocked ? "Role-based access" : "How to re-enable"}
          title={isRoleLocked ? "This is now behaving like a role-gated app" : "Turn the module back on"}
        >
          {isRoleLocked
            ? "Use the View as selector in the top bar to test different staff experiences. Practice Manager can access the full admin system."
            : "Go to Settings, find the module in Module Toggles, then click Enable."}
        </SectionHeader>

        <div className="blue-box">
          <strong>Current access</strong>
          <p>
            {module.lockReason ||
              `${module.name} is not available to ${activeUser.role}.`}
          </p>
        </div>

        <div className="policy-actions">
          <Button type="button" variant="primary" onClick={onOpenSettings}>
            Open Settings
          </Button>
        </div>
      </Panel>
    </>
  );
}


function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [activeUserId, setActiveUserId] = useLocalStorageState(
    ACTIVE_USER_STORAGE_KEY,
    getDefaultAppUser().id
  );

  const activeUser = useMemo(
    () => getAppUserById(activeUserId),
    [activeUserId]
  );

  const [moduleToggleSettings, setModuleToggleSettings] = useLocalStorageState(
    MODULE_SETTINGS_STORAGE_KEY,
    moduleSettings
  );

  const [holidayRequests, setHolidayRequests] = useLocalStorageState(
    STAFF_LEAVE_STORAGE_KEY,
    getDefaultHolidayRequests()
  );

  const [workforceProfiles, setWorkforceProfiles] = useLocalStorageState(
    WORKFORCE_PROFILES_STORAGE_KEY,
    getDefaultWorkforceProfiles()
  );

  const safeWorkforceProfiles = useMemo(
    () => getSafeWorkforceProfiles(workforceProfiles),
    [workforceProfiles]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSupabaseWorkforce() {
      if (!isCapacityBackboneAvailable()) return;
      const response = await fetchWorkforceProfilesFromSupabase();
      if (!cancelled && response.ok && Array.isArray(response.profiles) && response.profiles.length > 0) {
        setWorkforceProfiles(response.profiles);
      }
    }

    void loadSupabaseWorkforce();

    return () => {
      cancelled = true;
    };
  }, [setWorkforceProfiles]);

  const safeModuleToggleSettings = useMemo(
    () => mergeModuleToggleSettings(moduleToggleSettings, moduleSettings),
    [moduleToggleSettings]
  );

  const modulesWithToggleState = useMemo(
    () => {
      const toggleAwareModules = applyToggleStateToModules(
        modules,
        safeModuleToggleSettings
      );

      return applyUserAccessToModules(toggleAwareModules, activeUser);
    },
    [safeModuleToggleSettings, activeUser]
  );

  const visibleModules = useMemo(
    () => modulesWithToggleState.filter((module) => module.enabled !== false),
    [modulesWithToggleState]
  );

  useEffect(() => {
    const canSeeActivePage = visibleModules.some((module) => module.id === activePage);
    if (!canSeeActivePage) setActivePage("dashboard");
  }, [activePage, visibleModules]);

  const activeModule = useMemo(
    () => getActiveModule(visibleModules, activePage),
    [activePage, visibleModules]
  );

  const activeModuleSetting = useMemo(
    () => getModuleSetting(safeModuleToggleSettings, activePage),
    [safeModuleToggleSettings, activePage]
  );

  const appShellMetrics = useMemo(
    () => getAppShellMetrics(visibleModules),
    [visibleModules]
  );

  function navigateToPage(pageId) {
    setActivePage(pageId);
  }

  function addHolidayRequest(newRequest) {
    setHolidayRequests((currentRequests) =>
      addHolidayRequestToList(currentRequests, newRequest)
    );

    void logActivity({
      eventType: "leave_request_added",
      module: "Staff",
      title: "Leave request added",
      detail: `${newRequest.staffName} requested ${newRequest.deductedHours ?? newRequest.hours} hours from ${newRequest.startDate || newRequest.date}${newRequest.endDate && newRequest.endDate !== (newRequest.startDate || newRequest.date) ? ` to ${newRequest.endDate}` : ""}.`,
      actorName: activeUser.name,
      actorRole: activeUser.role,
      metadata: newRequest,
    });
  }

  function updateHolidayRequestStatus(requestId, newStatus) {
    const targetRequest = holidayRequests.find(
      (request) => String(request.id) === String(requestId)
    );

    setHolidayRequests((currentRequests) =>
      updateHolidayRequestStatusInList(currentRequests, requestId, newStatus)
    );

    void logActivity({
      eventType: "leave_request_status_changed",
      module: "Staff",
      title: `Leave request ${newStatus.toLowerCase()}`,
      detail: targetRequest
        ? `${targetRequest.staffName} leave on ${targetRequest.date} changed to ${newStatus}.`
        : `Leave request ${requestId} changed to ${newStatus}.`,
      actorName: activeUser.name,
      actorRole: activeUser.role,
      metadata: {
        requestId,
        newStatus,
        request: targetRequest,
      },
    });
  }

  function addContractAmendment(staffName, amendment) {
    setWorkforceProfiles((currentProfiles) =>
      addContractAmendmentToProfiles(currentProfiles, staffName, amendment)
    );

    void logActivity({
      eventType: "contract_amendment_added",
      module: "Staff",
      title: "Contract amendment added",
      detail: `${staffName} workforce profile amended from ${amendment.effectiveDate}.`,
      actorName: activeUser.name,
      actorRole: activeUser.role,
      metadata: {
        staffName,
        amendment,
      },
    });
  }

  function addStaffProfile(newProfile) {
    setWorkforceProfiles((currentProfiles) =>
      addStaffProfileToProfiles(currentProfiles, newProfile)
    );

    void logActivity({
      eventType: "staff_profile_added",
      module: "Staff",
      title: "Staff profile added",
      detail: `${newProfile.name} staff profile was added.`,
      actorName: activeUser.name,
      actorRole: activeUser.role,
      metadata: newProfile,
    });
  }

  function updateStaffProfile(staffName, patch) {
    setWorkforceProfiles((currentProfiles) =>
      updateStaffProfileInList(currentProfiles, staffName, patch)
    );

    void logActivity({
      eventType: "staff_profile_updated",
      module: "Staff",
      title: "Staff profile updated",
      detail: `${staffName} staff profile was updated.`,
      actorName: activeUser.name,
      actorRole: activeUser.role,
      metadata: {
        staffName,
        changedFields: Object.keys(patch || {}),
      },
    });
  }

  function resetWorkforceProfiles() {
    setWorkforceProfiles(getDefaultWorkforceProfiles());

    void logActivity({
      eventType: "workforce_profiles_reset",
      module: "Staff",
      title: "Workforce profiles reset",
      detail: "Workforce profiles were reset to the demo defaults.",
      actorName: activeUser.name,
      actorRole: activeUser.role,
    });
  }

  function renderEnabledPage() {
    if (activePage === "staff") {
      return (
        <StaffPage
          holidayRequests={holidayRequests}
          addHolidayRequest={addHolidayRequest}
          updateHolidayRequestStatus={updateHolidayRequestStatus}
          currentUser={activeUser}
          staffList={safeWorkforceProfiles}
          addContractAmendment={addContractAmendment}
          addStaffProfile={addStaffProfile}
          updateStaffProfile={updateStaffProfile}
          resetWorkforceProfiles={resetWorkforceProfiles}
        />
      );
    }

    if (activePage === "calendar") {
      return <CalendarPage holidayRequests={holidayRequests} currentUser={activeUser} staffList={safeWorkforceProfiles} />;
    }

    if (activePage === "inbox") {
      return <InboxPage holidayRequests={holidayRequests} currentUser={activeUser} staffList={safeWorkforceProfiles} />;
    }

    if (activePage === "compliance") {
      return <CompliancePage currentUser={activeUser} staffList={safeWorkforceProfiles} />;
    }
    if (activePage === "training") {
      return <TrainingPage currentUser={activeUser} staffList={safeWorkforceProfiles} />;
    }

    if (activePage === "audits") {
      return <AuditsPage currentUser={activeUser} staffList={safeWorkforceProfiles} />;
    }

    if (activePage === "finance") return <FinancePage />;

    if (activePage === "documents") {
      return <DocumentsPage currentUser={activeUser} />;
    }

    if (activePage === "access") {
      return <AuthPage currentUser={activeUser} staffList={safeWorkforceProfiles} holidayRequests={holidayRequests} />;
    }

    if (activePage === "care-navigation") {
      return <CareNavigationPage currentUser={activeUser} staffList={safeWorkforceProfiles} holidayRequests={holidayRequests} />;
    }

    if (activePage === "settings") {
      return (
        <SettingsPage
          moduleToggleSettings={safeModuleToggleSettings}
          setModuleToggleSettings={setModuleToggleSettings}
          currentUser={activeUser}
        />
      );
    }

    return (
      <DashboardPage
        holidayRequests={holidayRequests}
        currentUser={activeUser}
        staffList={safeWorkforceProfiles}
      />
    );
  }

  function renderActivePage() {
    return renderEnabledPage();
  }

  return (
    <div className="app-shell">
      <Sidebar
        modules={visibleModules}
        activePage={activePage}
        onNavigate={navigateToPage}
      />

      <main className="main-area">
        <Topbar
          activeModule={activeModule}
          users={appUsers}
          activeUser={activeUser}
          onUserChange={setActiveUserId}
        />

        <AppStatusStrip metrics={appShellMetrics} activeUser={activeUser} />

        {renderActivePage()}
      </main>

      <MobileNav
        modules={visibleModules}
        activePage={activePage}
        onNavigate={navigateToPage}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
