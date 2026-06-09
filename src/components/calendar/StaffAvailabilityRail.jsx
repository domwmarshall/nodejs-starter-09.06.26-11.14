import { Users } from "lucide-react";
import { Badge } from "../Badge";

export function StaffAvailabilityRail({ staffList = [] }) {
  const staff = Array.isArray(staffList) ? staffList.slice(0, 8) : [];
  return (
    <aside className="staff-availability-rail">
      <div className="availability-heading">
        <Users size={17} />
        <strong>Available staff</strong>
      </div>
      {staff.map((member) => (
        <div className="availability-person" key={member.id || member.name}>
          <div>
            <strong>{member.name || member.staffName}</strong>
            <span>{member.role || member.team || member.jobTitle || "Role not set"}</span>
          </div>
          <Badge>Demo</Badge>
        </div>
      ))}
    </aside>
  );
}
