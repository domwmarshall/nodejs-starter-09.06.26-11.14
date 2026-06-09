import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const fallbackColours = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#fb7185', '#06b6d4'];

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <strong>{item.name}</strong>
      <span>{item.value}</span>
    </div>
  );
}

export function ModulePieChart({ data = [], height = 190 }) {
  return (
    <div className="pie-chart-shell" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="54%"
            outerRadius="78%"
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            stroke="#ffffff"
            strokeWidth={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.colour || fallbackColours[index % fallbackColours.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
