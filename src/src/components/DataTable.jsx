import { EmptyState } from "./ui";

export function DataTable({
  columns,
  rows = [],
  renderCell,
  emptyTitle = "No records found",
  emptyMessage = "There is nothing to show here yet.",
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (safeRows.length === 0) {
    return (
      <EmptyState
        className="table-empty-state"
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {safeRows.map((row, rowIndex) => (
              <tr key={row.id || row.name || row.title || rowIndex}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {renderCell ? renderCell(row, column.key) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          Showing <strong>{safeRows.length}</strong>{" "}
          {safeRows.length === 1 ? "record" : "records"}
        </span>
      </div>
    </div>
  );
}