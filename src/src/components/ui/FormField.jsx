export function FormField({ label, children, hint, className = "" }) {
  return (
    <label className={["form-field", className].filter(Boolean).join(" ")}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export const fieldClassName = "field-control";
