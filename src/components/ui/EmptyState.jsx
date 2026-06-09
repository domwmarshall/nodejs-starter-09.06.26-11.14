import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing to show",
  message = "There are no records to display yet.",
  icon: Icon = Inbox,
  action,
  className = "",
}) {
  return (
    <div className={["empty-state-ui", className].filter(Boolean).join(" ")}>
      <div className="empty-state-ui-icon">
        <Icon size={24} />
      </div>

      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>

      {action ? <div className="empty-state-ui-action">{action}</div> : null}
    </div>
  );
}