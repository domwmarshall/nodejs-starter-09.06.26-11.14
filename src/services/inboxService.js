import { inboxItems } from "../data/inbox";
import { daysUntil, getDueText } from "../utils/dateUtils";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const INBOX_STORAGE_KEY = SETTINGS_STORAGE_KEYS.inboxItems;

export function getDefaultInboxItems() {
  return inboxItems;
}

export function enrichInboxItems(items) {
  const safeItems = Array.isArray(items) ? items : inboxItems;

  return safeItems.map((item) => ({
    ...item,
    dueText: getDueText(item.dueDate),
    daysUntilDue: daysUntil(item.dueDate),
  }));
}

export function filterInboxItems(items, searchTerm, activeFilter) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeSearchTerm = String(searchTerm || "").toLowerCase();

  return safeItems.filter((item) => {
    const searchText = `${item.title || ""} ${item.module || ""} ${
      item.type || ""
    } ${item.assignedTo || ""} ${item.description || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(safeSearchTerm);

    const matchesFilter =
      activeFilter === "All" ||
      item.priority === activeFilter ||
      item.status === activeFilter ||
      item.module === activeFilter;

    return matchesSearch && matchesFilter;
  });
}

export function getInboxMetrics(items) {
  const enrichedItems = enrichInboxItems(items);

  const openItems = enrichedItems.filter((item) => item.status === "Open");

  const highPriorityItems = enrichedItems.filter(
    (item) => item.priority === "High" && item.status !== "Done"
  );

  const overdueItems = enrichedItems.filter(
    (item) => item.daysUntilDue < 0 && item.status !== "Done"
  );

  const doneItems = enrichedItems.filter((item) => item.status === "Done");

  return {
    enrichedItems,
    openItems,
    highPriorityItems,
    overdueItems,
    doneItems,
  };
}

export function updateInboxItemStatus(items, itemId, newStatus) {
  const safeItems = Array.isArray(items) ? items : inboxItems;

  return safeItems.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status: newStatus,
        }
      : item
  );
}

export function getInboxModuleSummary(items, moduleName) {
  const enrichedItems = enrichInboxItems(items);

  const moduleItems = enrichedItems.filter(
    (item) => item.module === moduleName && item.status !== "Done"
  );

  const highCount = moduleItems.filter(
    (item) => item.priority === "High"
  ).length;

  return {
    moduleItems,
    highCount,
    riskLabel: highCount > 0 ? "High" : "Medium",
  };
}