import { getRoomConflicts } from "./roomAllocationService";
import { getMissingShiftAlerts } from "./shiftFillerService";

export function getRotaAlertsForDate({ date, shifts = [], staffList = [] }) {
  return [
    ...getMissingShiftAlerts({ date, shifts, staffList }),
    ...getRoomConflicts(shifts).map((alert) => ({ ...alert, date })),
  ];
}

export function getRotaAlertMetrics(alerts = []) {
  return {
    total: alerts.length,
    high: alerts.filter((alert) => alert.severity === "High").length,
    medium: alerts.filter((alert) => alert.severity === "Medium").length,
  };
}
