export function PageHeader({ eyebrow, title, children, action }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="page-header-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {children ? <p>{children}</p> : null}
      </div>

      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}
