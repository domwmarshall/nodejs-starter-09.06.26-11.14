export function formatDate(dateString) {
  if (!dateString) return "Not set";

  const date = new Date(dateString + "T12:00:00");

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(dateString) {
  if (!dateString) return null;

  const today = new Date();
  const date = new Date(dateString + "T12:00:00");
  const difference = date.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

export function getDueText(dateString) {
  const days = daysUntil(dateString);

  if (days === null) return "No date set";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";

  return `Due in ${days} days`;
}

export function getReviewStatus(dateString, fallbackStatus = "Approved") {
  const days = daysUntil(dateString);

  if (days === null) return fallbackStatus;
  if (days < 0) return "Overdue";
  if (days <= 60) return "Due soon";

  return fallbackStatus;
}