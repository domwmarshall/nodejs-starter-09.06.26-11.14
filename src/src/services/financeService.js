import {
  expectedPayments,
  financeTasks,
  dispensaryProfitLines,
  budgetAllocations,
  invoicePlaceholders,
  financeOverview,
} from "../data/finance";

import {
  supplierInvoiceLines,
  gppReimbursementLines,
  dispensarySwitchRecommendations,
} from "../data/dispensaryFinance";

import { daysUntil, getDueText } from "../utils/dateUtils";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const FINANCE_TASKS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.financeTasks;
export const DISPENSARY_INVOICE_LINES_STORAGE_KEY = "gpop-dispensary-invoice-lines";

export function formatMoney(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatMoneyPrecise(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercentage(value) {
  if (!Number.isFinite(Number(value))) return "0%";
  return `${Number(value).toFixed(1)}%`;
}

export function getDefaultFinanceTasks() {
  return financeTasks;
}

export function getDefaultSupplierInvoiceLines() {
  return supplierInvoiceLines;
}

export function enrichExpectedPayments(payments = expectedPayments) {
  const safePayments = Array.isArray(payments) ? payments : expectedPayments;

  return safePayments.map((payment) => ({
    ...payment,
    variance: payment.receivedAmount - payment.expectedAmount,
    daysUntilDue: daysUntil(payment.expectedDate),
    dueText: getDueText(payment.expectedDate),
  }));
}

export function filterExpectedPayments(payments, searchTerm) {
  const safePayments = Array.isArray(payments) ? payments : [];

  return safePayments.filter((payment) => {
    const searchText =
      `${payment.source} ${payment.category} ${payment.status} ${payment.note}`.toLowerCase();

    return searchText.includes(searchTerm.toLowerCase());
  });
}

export function getFinanceTaskMetrics(tasks = financeTasks) {
  const safeTasks = Array.isArray(tasks) ? tasks : financeTasks;

  const openTasks = safeTasks.filter((task) => task.status === "Open");

  const highPriorityTasks = safeTasks.filter(
    (task) => task.priority === "High" && task.status !== "Done"
  );

  const overdueTasks = safeTasks.filter(
    (task) => daysUntil(task.dueDate) < 0 && task.status !== "Done"
  );

  return {
    openTasks,
    highPriorityTasks,
    overdueTasks,
  };
}

export function getPaymentTotals(payments = expectedPayments) {
  const enrichedPayments = enrichExpectedPayments(payments);

  const totalExpected = enrichedPayments.reduce(
    (total, payment) => total + payment.expectedAmount,
    0
  );

  const totalReceived = enrichedPayments.reduce(
    (total, payment) => total + payment.receivedAmount,
    0
  );

  const outstanding = totalExpected - totalReceived;

  return {
    totalExpected,
    totalReceived,
    outstanding,
  };
}

export function getDispensaryMargin() {
  return dispensaryProfitLines.reduce((total, line) => total + line.margin, 0);
}

export function getBudgetTotals() {
  const totalMonthlyCosts = budgetAllocations.reduce(
    (total, item) => total + item.monthlyCost,
    0
  );

  const totalReclaimable = budgetAllocations.reduce(
    (total, item) => total + item.reclaimable,
    0
  );

  return {
    totalMonthlyCosts,
    totalReclaimable,
  };
}

export function updateFinanceTaskStatus(tasks, taskId, newStatus) {
  const safeTasks = Array.isArray(tasks) ? tasks : financeTasks;

  return safeTasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: newStatus,
        }
      : task
  );
}

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getLineTotal(line) {
  return Number(line.quantity || 0) * Number(line.unitCost || 0);
}

export function enrichSupplierInvoiceLines(lines = supplierInvoiceLines) {
  const safeLines = Array.isArray(lines) ? lines : supplierInvoiceLines;

  return safeLines.map((line) => ({
    ...line,
    quantity: Number(line.quantity || 0),
    unitCost: Number(line.unitCost || 0),
    totalCost: getLineTotal(line),
  }));
}

export function createSupplierInvoiceLine({
  supplier,
  invoiceNumber,
  invoiceDate,
  drugName,
  packSize,
  quantity,
  unitCost,
  reimbursementCode,
  category,
}) {
  return {
    id: Date.now(),
    supplier,
    invoiceNumber: invoiceNumber || `${supplier || "INV"}-${Date.now()}`,
    invoiceDate,
    drugName,
    packSize,
    quantity: Number(quantity || 0),
    unitCost: Number(unitCost || 0),
    reimbursementCode,
    category: category || "Generic",
    status: "Manual entry",
  };
}

export function addSupplierInvoiceLine(lines, newLine) {
  const safeLines = Array.isArray(lines) ? lines : supplierInvoiceLines;
  return [newLine, ...safeLines];
}

export function deleteSupplierInvoiceLine(lines, lineId) {
  const safeLines = Array.isArray(lines) ? lines : supplierInvoiceLines;
  return safeLines.filter((line) => line.id !== lineId);
}

export function updateSupplierInvoiceLineStatus(lines, lineId, newStatus) {
  const safeLines = Array.isArray(lines) ? lines : supplierInvoiceLines;
  return safeLines.map((line) =>
    line.id === lineId
      ? {
          ...line,
          status: newStatus,
        }
      : line
  );
}

export function getInvoiceSupplierSummary(lines = supplierInvoiceLines) {
  const enrichedLines = enrichSupplierInvoiceLines(lines);

  return Object.values(
    enrichedLines.reduce((summary, line) => {
      const supplier = line.supplier || "Unknown";

      if (!summary[supplier]) {
        summary[supplier] = {
          id: supplier,
          supplier,
          lineCount: 0,
          totalSpend: 0,
          reviewLines: 0,
        };
      }

      summary[supplier].lineCount += 1;
      summary[supplier].totalSpend += line.totalCost;

      if (line.status === "Review") {
        summary[supplier].reviewLines += 1;
      }

      return summary;
    }, {})
  ).sort((a, b) => b.totalSpend - a.totalSpend);
}

function findInvoiceMatches(reimbursementLine, invoiceLines) {
  const code = normalise(reimbursementLine.reimbursementCode);
  const name = normalise(reimbursementLine.drugName);

  return invoiceLines.filter((line) => {
    const lineCode = normalise(line.reimbursementCode);
    const lineName = normalise(line.drugName);

    return (code && lineCode === code) || (name && lineName === name);
  });
}

function getProfitStatus(margin, marginPercent, matchedInvoiceLines) {
  if (matchedInvoiceLines.length === 0) return "Missing invoice";
  if (margin < 0) return "Loss";
  if (marginPercent < 7.5) return "Low margin";
  return "Positive";
}

function getProfitAction(status, row) {
  if (status === "Missing invoice") return "Upload or enter supplier invoice line.";
  if (status === "Loss") return "Check supplier price, reimbursement and prescribing/ordering options.";
  if (status === "Low margin") return "Monitor next month and compare PSUK/e-CASS price.";
  if (row.itemType?.includes("PA")) return "Confirm PA/high-cost reimbursement at month end.";
  return "No immediate action.";
}

export function getDispensaryProfitability({
  invoiceLines = supplierInvoiceLines,
  reimbursementLines = gppReimbursementLines,
} = {}) {
  const enrichedInvoiceLines = enrichSupplierInvoiceLines(invoiceLines);

  const rows = reimbursementLines.map((line) => {
    const matchedInvoiceLines = findInvoiceMatches(line, enrichedInvoiceLines);
    const supplierCost = matchedInvoiceLines.reduce(
      (total, invoiceLine) => total + invoiceLine.totalCost,
      0
    );

    const reimbursement =
      Number(line.dispensedQuantity || 0) * Number(line.reimbursementPerPack || 0);

    const margin = reimbursement - supplierCost;
    const marginPercent = reimbursement > 0 ? (margin / reimbursement) * 100 : 0;
    const status = getProfitStatus(margin, marginPercent, matchedInvoiceLines);

    return {
      ...line,
      supplierCost,
      reimbursement,
      margin,
      marginPercent,
      status,
      action: getProfitAction(status, line),
      matchedInvoiceCount: matchedInvoiceLines.length,
      suppliers: matchedInvoiceLines.map((invoiceLine) => invoiceLine.supplier).join(", ") || "Not matched",
    };
  });

  const unmatchedInvoiceLines = enrichedInvoiceLines.filter((line) => {
    const code = normalise(line.reimbursementCode);
    const name = normalise(line.drugName);

    return !reimbursementLines.some((reimbursementLine) => {
      const reimbursementCode = normalise(reimbursementLine.reimbursementCode);
      const reimbursementName = normalise(reimbursementLine.drugName);
      return (
        (code && code === reimbursementCode) ||
        (name && name === reimbursementName)
      );
    });
  });

  const totalSupplierCost = enrichedInvoiceLines.reduce(
    (total, line) => total + line.totalCost,
    0
  );

  const totalReimbursement = rows.reduce(
    (total, row) => total + row.reimbursement,
    0
  );

  const grossProfit = totalReimbursement - totalSupplierCost;
  const grossMarginPercent = totalReimbursement > 0 ? (grossProfit / totalReimbursement) * 100 : 0;
  const lossRows = rows.filter((row) => row.status === "Loss");
  const lowMarginRows = rows.filter((row) => row.status === "Low margin");
  const missingInvoiceRows = rows.filter((row) => row.status === "Missing invoice");
  const paRows = rows.filter((row) => String(row.itemType || "").includes("PA"));

  return {
    rows,
    unmatchedInvoiceLines,
    totalSupplierCost,
    totalReimbursement,
    grossProfit,
    grossMarginPercent,
    lossRows,
    lowMarginRows,
    missingInvoiceRows,
    paRows,
    reviewRows: [...lossRows, ...lowMarginRows, ...missingInvoiceRows],
  };
}

export function getDispensaryActionQueue(profitability) {
  const safeProfitability = profitability || getDispensaryProfitability();

  const marginActions = safeProfitability.reviewRows.map((row) => ({
    id: `margin-${row.id}`,
    drugName: row.drugName,
    issue: row.status,
    suggestedAction: row.action,
    priority: row.status === "Loss" || row.status === "Missing invoice" ? "High" : "Medium",
  }));

  const unmatchedActions = safeProfitability.unmatchedInvoiceLines.map((line) => ({
    id: `unmatched-${line.id}`,
    drugName: line.drugName,
    issue: "Invoice not matched to GPP line",
    suggestedAction: "Check reimbursement code, GPP statement timing or dispensing status.",
    priority: "Medium",
  }));

  return [...marginActions, ...unmatchedActions, ...dispensarySwitchRecommendations].sort(
    (a, b) => (a.priority === "High" ? -1 : 1) - (b.priority === "High" ? -1 : 1)
  );
}

export function getFinanceStaticData() {
  return {
    financeOverview,
    expectedPayments,
    financeTasks,
    dispensaryProfitLines,
    budgetAllocations,
    invoicePlaceholders,
    supplierInvoiceLines,
    gppReimbursementLines,
    dispensarySwitchRecommendations,
  };
}
