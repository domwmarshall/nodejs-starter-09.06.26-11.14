import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export function ProgressDonut({ value = 0, label, colour = '#2563eb', suffix = '%' }) {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, 100));
  const data = [
    { name: 'Complete', value: safeValue },
    { name: 'Remaining', value: 100 - safeValue },
  ];

  return (
    <div className="progress-donut-card">
      <div className="progress-donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="72%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={colour} />
              <Cell fill="#e8eef7" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <strong>{Math.round(safeValue)}{suffix}</strong>
      </div>
      {label ? <span>{label}</span> : null}
    </div>
  );
}
