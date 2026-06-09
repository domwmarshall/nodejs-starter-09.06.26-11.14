import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function TempTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload.find((item) => item.dataKey === 'temp')?.value;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>{Number(value).toFixed(1)}°C</span>
    </div>
  );
}

export function TemperatureLineChart({ data, colour = '#2563eb' }) {
  return (
    <div className="temperature-chart-shell">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={`tempGradient-${colour.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colour} stopOpacity={0.26} />
              <stop offset="100%" stopColor={colour} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6edf7" />
          <ReferenceArea y1={2} y2={8} fill="#10b981" fillOpacity={0.08} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}°`}
          />
          <Tooltip content={<TempTooltip />} />
          <Area
            type="monotone"
            dataKey="temp"
            stroke="none"
            fill={`url(#tempGradient-${colour.replace('#', '')})`}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke={colour}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
