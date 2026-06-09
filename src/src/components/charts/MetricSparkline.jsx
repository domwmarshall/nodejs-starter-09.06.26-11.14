import { Line, LineChart, ResponsiveContainer } from 'recharts';

export function MetricSparkline({ data = [], colour = '#2563eb' }) {
  return (
    <div className="sparkline-shell">
      <ResponsiveContainer width="100%" height={38}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Line type="monotone" dataKey="value" stroke={colour} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
