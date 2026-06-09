import { UserRound } from "lucide-react";

export function UserSwitcher({ users, activeUser, onChange }) {
  return (
    <label className="user-switcher">
      <UserRound size={15} />
      <span>View as</span>
      <select
        value={activeUser.id}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Switch current user role"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.role}
          </option>
        ))}
      </select>
    </label>
  );
}
