export function MetricCard({ title, value, detail, icon: Icon }) {
  return (
    <div className="metric-card">
      <div className="metric-card-topline">
        <p className="metric-title">{title}</p>
        <div className="metric-icon">{Icon ? <Icon size={17} /> : null}</div>
      </div>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </div>
  );
}
