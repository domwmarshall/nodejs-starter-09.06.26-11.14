export const moduleThemes = {
  Dashboard: { color: '#2563eb', soft: '#eff6ff', gradient: 'linear-gradient(135deg, #2563eb, #38bdf8)' },
  Staff: { color: '#0ea5e9', soft: '#e0f2fe', gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)' },
  Workforce: { color: '#0ea5e9', soft: '#e0f2fe', gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)' },
  Calendar: { color: '#6366f1', soft: '#eef2ff', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  Finance: { color: '#10b981', soft: '#ecfdf5', gradient: 'linear-gradient(135deg, #10b981, #22c55e)' },
  Dispensary: { color: '#06b6d4', soft: '#ecfeff', gradient: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' },
  Compliance: { color: '#8b5cf6', soft: '#f5f3ff', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
  Training: { color: '#f59e0b', soft: '#fffbeb', gradient: 'linear-gradient(135deg, #f59e0b, #fb923c)' },
  Audits: { color: '#fb7185', soft: '#fff1f2', gradient: 'linear-gradient(135deg, #fb7185, #f43f5e)' },
  Inbox: { color: '#64748b', soft: '#f8fafc', gradient: 'linear-gradient(135deg, #64748b, #334155)' },
  'Care Navigation': { color: '#4f46e5', soft: '#eef2ff', gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
  Settings: { color: '#475569', soft: '#f8fafc', gradient: 'linear-gradient(135deg, #475569, #1f2937)' },
};

export function getModuleTheme(moduleName = '') {
  return moduleThemes[moduleName] || moduleThemes.Dashboard;
}
