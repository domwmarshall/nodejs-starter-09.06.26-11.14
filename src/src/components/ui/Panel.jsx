export function Panel({ children, className = "", as: Component = "section", ...props }) {
  return (
    <Component className={["panel", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
