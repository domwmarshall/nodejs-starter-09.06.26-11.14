function getBadgeType(value) {
  const text = String(value || "").toLowerCase();

  if (
    text.includes("overdue") ||
    text.includes("high risk") ||
    text.includes("high") ||
    text.includes("rejected") ||
    text.includes("locked") ||
    text.includes("blocked") ||
    text.includes("disabled") ||
    text.includes("off") ||
    text.includes("action required") ||
    text.includes("required") ||
    text.includes("not connected") ||
    text.includes("not started") ||
    text.includes("clinical governance required") ||
    text.includes("clinical review required") ||
    text.includes("clinical safety review required")
  ) {
    return "danger";
  }

  if (
    text.includes("due soon") ||
    text.includes("medium risk") ||
    text.includes("medium") ||
    text.includes("pending") ||
    text.includes("open") ||
    text.includes("snoozed") ||
    text.includes("review") ||
    text.includes("draft") ||
    text.includes("part received") ||
    text.includes("expected") ||
    text.includes("prototype") ||
    text.includes("planned")
  ) {
    return "warning";
  }

  if (
    text.includes("approved") ||
    text.includes("complete") ||
    text.includes("completed") ||
    text.includes("done") ||
    text.includes("received") ||
    text.includes("positive") ||
    text.includes("enabled") ||
    text.includes("on") ||
    text.includes("safe") ||
    text.includes("clear") ||
    text.includes("up to date") ||
    text.includes("active") ||
    text.includes("reclaimable")
  ) {
    return "success";
  }

  if (
    text.includes("low risk") ||
    text.includes("low") ||
    text.includes("dummy") ||
    text.includes("local") ||
    text.includes("view") ||
    text.includes("limited") ||
    text.includes("acknowledge") ||
    text.includes("own profile")
  ) {
    return "info";
  }

  return "neutral";
}

export function Badge({ children }) {
  return (
    <span className={`badge badge-${getBadgeType(children)}`}>
      {children}
    </span>
  );
}