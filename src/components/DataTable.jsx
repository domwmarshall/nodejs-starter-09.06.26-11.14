import { useState } from "react";
import { EmptyState } from "./ui";

function getRowKey(row, rowIndex) {
  return String(row.id || row.name || row.title || row.staffName || rowIndex);
}

function renderCellContent(row, column, renderCell) {
  if (renderCell) return renderCell(row, column.key);
  return row[column.key];
}

export function DataTable({
  columns,
  rows = [],
  renderCell,
  emptyTitle = "No records found",
  emptyMessage = "There is nothing to show here yet.",
  primaryColumnKey,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];
  const [openRows, setOpenRows] = useState(() => new Set());

  if (safeRows.length === 0) {
    return (
      <EmptyState
        className="table-empty-state"
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  const primaryColumn =
    safeColumns.find((column) => column.key === primaryColumnKey) || safeColumns[0];
  const summaryColumns = safeColumns.filter((column) => column.key !== primaryColumn?.key).slice(0, 3);
  const detailColumns = safeColumns.filter((column) => column.key !== primaryColumn?.key);

  function toggleRow(rowKey) {
    setOpenRows((currentRows) => {
      const nextRows = new Set(currentRows);
      if (nextRows.has(rowKey)) {
        nextRows.delete(rowKey);
      } else {
        nextRows.add(rowKey);
      }
      return nextRows;
    });
  }

  return (
    <div className="data-card-list" data-record-count={safeRows.length}>
      {safeRows.map((row, rowIndex) => {
        const rowKey = getRowKey(row, rowIndex);
        const isOpen = openRows.has(rowKey);

        return (
          <article className={["data-record-card", isOpen ? "data-record-card-open" : ""].filter(Boolean).join(" ")} key={rowKey}>
            <button
              type="button"
              className="data-record-summary"
              onClick={() => toggleRow(rowKey)}
              aria-expanded={isOpen}
            >
              <div className="data-record-primary">
                <span>{primaryColumn?.label || "Record"}</span>
                <strong>{renderCellContent(row, primaryColumn, renderCell)}</strong>
              </div>

              <div className="data-record-summary-meta">
                {summaryColumns.map((column) => (
                  <div key={column.key}>
                    <span>{column.label}</span>
                    <strong>{renderCellContent(row, column, renderCell)}</strong>
                  </div>
                ))}
              </div>

              <span className="data-record-toggle">{isOpen ? "Less" : "Details"}</span>
            </button>

            {isOpen ? (
              <div className="data-record-details">
                {detailColumns.map((column) => (
                  <div key={column.key}>
                    <span>{column.label}</span>
                    <strong>{renderCellContent(row, column, renderCell)}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}

      <div className="data-card-footer">
        Showing <strong>{safeRows.length}</strong> {safeRows.length === 1 ? "record" : "records"}
      </div>
    </div>
  );
}
