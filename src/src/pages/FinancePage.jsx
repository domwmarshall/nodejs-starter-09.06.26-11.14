import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Clock,
  FileText,
  PlusCircle,
  PoundSterling,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate, getDueText } from "../utils/dateUtils";

import {
  financeOverview,
  expectedPayments,
  budgetAllocations,
  invoicePlaceholders,
} from "../data/finance";
import { supplierOptions } from "../data/dispensaryFinance";

import {
  DISPENSARY_INVOICE_LINES_STORAGE_KEY,
  FINANCE_TASKS_STORAGE_KEY,
  addSupplierInvoiceLine,
  createSupplierInvoiceLine,
  deleteSupplierInvoiceLine,
  enrichExpectedPayments,
  enrichSupplierInvoiceLines,
  filterExpectedPayments,
  formatMoney,
  formatMoneyPrecise,
  formatPercentage,
  getBudgetTotals,
  getDefaultFinanceTasks,
  getDefaultSupplierInvoiceLines,
  getDispensaryActionQueue,
  getDispensaryProfitability,
  getFinanceTaskMetrics,
  getInvoiceSupplierSummary,
  getPaymentTotals,
  updateFinanceTaskStatus,
  updateSupplierInvoiceLineStatus,
} from "../services/financeService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

const defaultInvoiceForm = {
  supplier: "AAH",
  invoiceNumber: "",
  invoiceDate: "2026-06-15",
  drugName: "",
  packSize: "28 tablets",
  quantity: 1,
  unitCost: 1,
  reimbursementCode: "",
  category: "Generic",
};

export function FinancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState(expectedPayments[0].id);
  const [invoiceForm, setInvoiceForm] = useState(defaultInvoiceForm);

  const [tasks, setTasks] = useLocalStorageState(
    FINANCE_TASKS_STORAGE_KEY,
    getDefaultFinanceTasks()
  );

  const [invoiceLines, setInvoiceLines] = useLocalStorageState(
    DISPENSARY_INVOICE_LINES_STORAGE_KEY,
    getDefaultSupplierInvoiceLines()
  );

  const enrichedPayments = useMemo(
    () => enrichExpectedPayments(expectedPayments),
    []
  );

  const filteredPayments = useMemo(
    () => filterExpectedPayments(enrichedPayments, searchTerm),
    [enrichedPayments, searchTerm]
  );

  const enrichedInvoiceLines = useMemo(
    () => enrichSupplierInvoiceLines(invoiceLines),
    [invoiceLines]
  );

  const filteredInvoiceLines = useMemo(() => {
    const query = invoiceSearchTerm.toLowerCase();

    return enrichedInvoiceLines.filter((line) => {
      const searchText = `${line.supplier} ${line.invoiceNumber} ${line.drugName} ${line.packSize} ${line.reimbursementCode} ${line.category} ${line.status}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [enrichedInvoiceLines, invoiceSearchTerm]);

  const selectedPayment =
    enrichedPayments.find((payment) => payment.id === selectedPaymentId) ||
    enrichedPayments[0];

  const taskMetrics = useMemo(() => getFinanceTaskMetrics(tasks), [tasks]);
  const paymentTotals = useMemo(() => getPaymentTotals(expectedPayments), []);
  const budgetTotals = useMemo(() => getBudgetTotals(), []);

  const dispensaryProfitability = useMemo(
    () => getDispensaryProfitability({ invoiceLines }),
    [invoiceLines]
  );

  const dispensaryActionQueue = useMemo(
    () => getDispensaryActionQueue(dispensaryProfitability),
    [dispensaryProfitability]
  );

  const supplierSummary = useMemo(
    () => getInvoiceSupplierSummary(invoiceLines),
    [invoiceLines]
  );

  function updateTaskStatus(taskId, newStatus) {
    setTasks((currentTasks) =>
      updateFinanceTaskStatus(currentTasks, taskId, newStatus)
    );
  }

  function updateInvoiceForm(fieldName, value) {
    setInvoiceForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  function submitInvoiceLine(event) {
    event.preventDefault();

    if (!invoiceForm.supplier || !invoiceForm.invoiceDate || !invoiceForm.drugName) {
      alert("Please complete supplier, date and drug name.");
      return;
    }

    const newLine = createSupplierInvoiceLine(invoiceForm);

    setInvoiceLines((currentLines) => addSupplierInvoiceLine(currentLines, newLine));
    setInvoiceForm({
      ...defaultInvoiceForm,
      supplier: invoiceForm.supplier,
      invoiceDate: invoiceForm.invoiceDate,
    });
  }

  function markInvoiceLine(lineId, status) {
    setInvoiceLines((currentLines) =>
      updateSupplierInvoiceLineStatus(currentLines, lineId, status)
    );
  }

  function removeInvoiceLine(lineId) {
    const confirmed = window.confirm("Remove this supplier invoice line from the prototype?");
    if (!confirmed) return;

    setInvoiceLines((currentLines) => deleteSupplierInvoiceLine(currentLines, lineId));
  }

  return (
    <>
      <PageHeader eyebrow="Finance" title="Finance & dispensary profitability engine">
        Finance v2.3 now has persistent supplier invoice lines, GPP-style
        reimbursement matching, margin/loss detection and dispensary action
        alerts. This is still dummy data only, but the workflow is now closer to
        a usable product.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard
          title="Expected income"
          value={formatMoney(paymentTotals.totalExpected)}
          detail={`${formatMoney(paymentTotals.totalReceived)} received`}
          icon={PoundSterling}
        />
        <MetricCard
          title="Outstanding"
          value={formatMoney(paymentTotals.outstanding)}
          detail="Expected but not yet received"
          icon={Clock}
        />
        <MetricCard
          title="Dispensary profit"
          value={formatMoney(dispensaryProfitability.grossProfit)}
          detail={`${formatPercentage(dispensaryProfitability.grossMarginPercent)} gross margin`}
          icon={Building2}
        />
        <MetricCard
          title="Loss lines"
          value={dispensaryProfitability.lossRows.length}
          detail={`${dispensaryProfitability.lowMarginRows.length} low margin`}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Invoice spend"
          value={formatMoney(dispensaryProfitability.totalSupplierCost)}
          detail={`${enrichedInvoiceLines.length} supplier lines`}
          icon={Upload}
        />
        <MetricCard
          title="Open finance tasks"
          value={taskMetrics.openTasks.length}
          detail={`${taskMetrics.highPriorityTasks.length} high priority`}
          icon={FileText}
        />
      </section>

      {dispensaryProfitability.lossRows.length > 0 ? (
        <AlertBanner
          tone="danger"
          title="Dispensary loss-making lines detected"
          icon={AlertTriangle}
        >
          {dispensaryProfitability.lossRows.length} dispensed item
          {dispensaryProfitability.lossRows.length === 1 ? " is" : "s are"} currently
          showing a negative margin. Review supplier price, GPP reimbursement and
          prescribing/ordering options before month end.
        </AlertBanner>
      ) : null}

      {dispensaryProfitability.missingInvoiceRows.length > 0 ? (
        <AlertBanner
          tone="warning"
          title="GPP lines missing supplier invoice match"
          icon={Upload}
        >
          {dispensaryProfitability.missingInvoiceRows.length} reimbursement line
          {dispensaryProfitability.missingInvoiceRows.length === 1 ? " has" : "s have"} no
          matching supplier invoice line yet.
        </AlertBanner>
      ) : null}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Dispensary" title="GPP vs supplier cost matching">
            This table compares mock GPP/reimbursement lines against supplier
            invoice lines using the reimbursement code or drug name.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "drugName", label: "Drug" },
              { key: "itemType", label: "Type" },
              { key: "suppliers", label: "Supplier" },
              { key: "supplierCost", label: "Supplier cost" },
              { key: "reimbursement", label: "Reimbursement" },
              { key: "margin", label: "Margin" },
              { key: "marginPercent", label: "Margin %" },
              { key: "status", label: "Status" },
            ]}
            rows={dispensaryProfitability.rows}
            renderCell={(row, key) => {
              if (key === "drugName") {
                return (
                  <div className="stacked-cell">
                    <strong>{row.drugName}</strong>
                    <span>{row.reimbursementCode}</span>
                  </div>
                );
              }

              if (key === "supplierCost" || key === "reimbursement" || key === "margin") {
                return formatMoneyPrecise(row[key]);
              }

              if (key === "marginPercent") return formatPercentage(row.marginPercent);

              if (key === "status" || key === "itemType") return <Badge>{row[key]}</Badge>;

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Dispensary summary" title="Month-end position">
            High-level profitability position from the current supplier invoice
            and GPP matching model.
          </SectionHeader>

          <div className="finance-overview-grid">
            <div>
              <span>Supplier spend</span>
              <strong>{formatMoney(dispensaryProfitability.totalSupplierCost)}</strong>
            </div>
            <div>
              <span>GPP reimbursement</span>
              <strong>{formatMoney(dispensaryProfitability.totalReimbursement)}</strong>
            </div>
            <div>
              <span>Gross profit</span>
              <strong>{formatMoney(dispensaryProfitability.grossProfit)}</strong>
            </div>
            <div>
              <span>Gross margin</span>
              <strong>{formatPercentage(dispensaryProfitability.grossMarginPercent)}</strong>
            </div>
            <div>
              <span>PA / high-cost rows</span>
              <strong>{dispensaryProfitability.paRows.length}</strong>
            </div>
            <div>
              <span>Unmatched invoices</span>
              <strong>{dispensaryProfitability.unmatchedInvoiceLines.length}</strong>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Supplier invoices" title="Manual invoice line entry">
            This is the prototype version of the future invoice uploader. For now,
            enter supplier lines manually and the profit engine recalculates
            immediately.
          </SectionHeader>

          <form className="finance-invoice-form" onSubmit={submitInvoiceLine}>
            <FormField label="Supplier">
              <select
                className={fieldClassName}
                value={invoiceForm.supplier}
                onChange={(event) => updateInvoiceForm("supplier", event.target.value)}
              >
                {supplierOptions.map((supplier) => (
                  <option key={supplier}>{supplier}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Invoice number">
              <input
                className={fieldClassName}
                type="text"
                value={invoiceForm.invoiceNumber}
                onChange={(event) => updateInvoiceForm("invoiceNumber", event.target.value)}
                placeholder="Optional"
              />
            </FormField>

            <FormField label="Invoice date">
              <input
                className={fieldClassName}
                type="date"
                value={invoiceForm.invoiceDate}
                onChange={(event) => updateInvoiceForm("invoiceDate", event.target.value)}
              />
            </FormField>

            <FormField label="Drug / item name">
              <input
                className={fieldClassName}
                type="text"
                value={invoiceForm.drugName}
                onChange={(event) => updateInvoiceForm("drugName", event.target.value)}
                placeholder="e.g. Omeprazole 20mg capsules"
              />
            </FormField>

            <FormField label="Pack size">
              <input
                className={fieldClassName}
                type="text"
                value={invoiceForm.packSize}
                onChange={(event) => updateInvoiceForm("packSize", event.target.value)}
              />
            </FormField>

            <FormField label="Quantity">
              <input
                className={fieldClassName}
                type="number"
                min="0"
                step="1"
                value={invoiceForm.quantity}
                onChange={(event) => updateInvoiceForm("quantity", event.target.value)}
              />
            </FormField>

            <FormField label="Unit cost">
              <input
                className={fieldClassName}
                type="number"
                min="0"
                step="0.01"
                value={invoiceForm.unitCost}
                onChange={(event) => updateInvoiceForm("unitCost", event.target.value)}
              />
            </FormField>

            <FormField label="Reimbursement code">
              <input
                className={fieldClassName}
                type="text"
                value={invoiceForm.reimbursementCode}
                onChange={(event) => updateInvoiceForm("reimbursementCode", event.target.value)}
                placeholder="Must match GPP code where possible"
              />
            </FormField>

            <FormField label="Category">
              <select
                className={fieldClassName}
                value={invoiceForm.category}
                onChange={(event) => updateInvoiceForm("category", event.target.value)}
              >
                <option>Generic</option>
                <option>Branded / high cost</option>
                <option>Special</option>
                <option>Appliance</option>
                <option>Other</option>
              </select>
            </FormField>

            <div className="finance-form-preview">
              <span>Line total</span>
              <strong>
                {formatMoneyPrecise(Number(invoiceForm.quantity || 0) * Number(invoiceForm.unitCost || 0))}
              </strong>
            </div>

            <div className="finance-form-actions">
              <Button type="submit" variant="primary" leftIcon={PlusCircle}>
                Add invoice line
              </Button>
            </div>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Actions" title="Dispensary action queue">
            Margin losses, missing invoice matches and recommended ordering checks.
          </SectionHeader>

          <div className="governance-alert-grid">
            {dispensaryActionQueue.slice(0, 8).map((action) => (
              <div className="governance-alert" key={action.id}>
                <div>
                  <strong>{action.drugName}</strong>
                  <span>
                    {action.issue} · {action.suggestedAction}
                  </span>
                </div>
                <Badge>{action.priority}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Invoice register" title="Supplier invoice lines">
            Search invoice lines and mark them as reviewed once reconciled. These
            entries persist in browser localStorage.
          </SectionHeader>

          <div className="compliance-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search supplier, drug, code, invoice number..."
                value={invoiceSearchTerm}
                onChange={(event) => setInvoiceSearchTerm(event.target.value)}
              />
            </label>

            <div className="finance-summary-chip">
              <strong>{formatMoney(dispensaryProfitability.totalSupplierCost)}</strong>
              <span>Total invoice spend</span>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "drugName", label: "Drug" },
              { key: "supplier", label: "Supplier" },
              { key: "invoiceDate", label: "Date" },
              { key: "quantity", label: "Qty" },
              { key: "unitCost", label: "Unit cost" },
              { key: "totalCost", label: "Total" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
            rows={filteredInvoiceLines}
            emptyTitle="No invoice lines found"
            emptyMessage="Try clearing the search box or add a new invoice line."
            renderCell={(row, key) => {
              if (key === "drugName") {
                return (
                  <div className="stacked-cell">
                    <strong>{row.drugName}</strong>
                    <span>{row.invoiceNumber} · {row.reimbursementCode || "No code"}</span>
                  </div>
                );
              }

              if (key === "invoiceDate") return formatDate(row.invoiceDate);
              if (key === "unitCost" || key === "totalCost") return formatMoneyPrecise(row[key]);
              if (key === "status" || key === "supplier") return <Badge>{row[key]}</Badge>;

              if (key === "actions") {
                return (
                  <div className="action-buttons">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => markInvoiceLine(row.id, "Reviewed")}
                    >
                      Reviewed
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      leftIcon={Trash2}
                      onClick={() => removeInvoiceLine(row.id)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Suppliers" title="Spend by supplier">
            Live supplier spend summary from invoice lines.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "supplier", label: "Supplier" },
              { key: "lineCount", label: "Lines" },
              { key: "totalSpend", label: "Spend" },
              { key: "reviewLines", label: "Review" },
            ]}
            rows={supplierSummary}
            renderCell={(row, key) => {
              if (key === "supplier") return <strong>{row.supplier}</strong>;
              if (key === "totalSpend") return formatMoney(row.totalSpend);
              if (key === "reviewLines") return <Badge>{row.reviewLines}</Badge>;
              return row[key];
            }}
          />
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Tasks" title="Finance action queue">
            These task statuses persist in browser localStorage.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "title", label: "Task" },
              { key: "area", label: "Area" },
              { key: "owner", label: "Owner" },
              { key: "dueDate", label: "Due" },
              { key: "priority", label: "Priority" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
            rows={tasks}
            renderCell={(row, key) => {
              if (key === "title") return <strong>{row.title}</strong>;

              if (key === "dueDate") {
                return (
                  <div className="stacked-cell">
                    <strong>{formatDate(row.dueDate)}</strong>
                    <span>{getDueText(row.dueDate)}</span>
                  </div>
                );
              }

              if (key === "priority" || key === "status" || key === "area") {
                return <Badge>{row[key]}</Badge>;
              }

              if (key === "actions") {
                return (
                  <div className="action-buttons">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => updateTaskStatus(row.id, "Done")}
                    >
                      Done
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => updateTaskStatus(row.id, "Snoozed")}
                    >
                      Snooze
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => updateTaskStatus(row.id, "Open")}
                    >
                      Reopen
                    </Button>
                  </div>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Overview" title="Monthly position">
            Mock management summary for the selected finance period.
          </SectionHeader>

          <div className="finance-overview-grid">
            <div>
              <span>Month</span>
              <strong>{financeOverview.month}</strong>
            </div>
            <div>
              <span>Expected income</span>
              <strong>{formatMoney(financeOverview.expectedIncome)}</strong>
            </div>
            <div>
              <span>Confirmed income</span>
              <strong>{formatMoney(financeOverview.confirmedIncome)}</strong>
            </div>
            <div>
              <span>Expected costs</span>
              <strong>{formatMoney(financeOverview.expectedCosts)}</strong>
            </div>
            <div>
              <span>Estimated surplus</span>
              <strong>{formatMoney(financeOverview.estimatedSurplus)}</strong>
            </div>
            <div>
              <span>Dispensary profit estimate</span>
              <strong>{formatMoney(dispensaryProfitability.grossProfit)}</strong>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Expected payments" title="Payment tracker">
            Search expected income and select a payment to view details.
          </SectionHeader>

          <div className="compliance-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search payments, categories, notes..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="finance-summary-chip">
              <strong>{formatMoney(paymentTotals.outstanding)}</strong>
              <span>Outstanding</span>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "source", label: "Source" },
              { key: "category", label: "Category" },
              { key: "expectedDate", label: "Expected date" },
              { key: "expectedAmount", label: "Expected" },
              { key: "receivedAmount", label: "Received" },
              { key: "variance", label: "Variance" },
              { key: "status", label: "Status" },
            ]}
            rows={filteredPayments}
            emptyTitle="No payments found"
            emptyMessage="Try clearing the search box."
            renderCell={(row, key) => {
              if (key === "source") {
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-button"
                    style={{ padding: 0, justifyContent: "flex-start" }}
                    onClick={() => setSelectedPaymentId(row.id)}
                  >
                    {row.source}
                  </Button>
                );
              }

              if (key === "expectedDate") {
                return (
                  <div className="stacked-cell">
                    <strong>{formatDate(row.expectedDate)}</strong>
                    <span>{row.dueText}</span>
                  </div>
                );
              }

              if (
                key === "expectedAmount" ||
                key === "receivedAmount" ||
                key === "variance"
              ) {
                return formatMoney(row[key]);
              }

              if (key === "status" || key === "category") {
                return <Badge>{row[key]}</Badge>;
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Selected payment" title={selectedPayment.source}>
            {selectedPayment.note}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div>
              <span>Category</span>
              <Badge>{selectedPayment.category}</Badge>
            </div>
            <div>
              <span>Status</span>
              <Badge>{selectedPayment.status}</Badge>
            </div>
            <div>
              <span>Expected date</span>
              <strong>{formatDate(selectedPayment.expectedDate)}</strong>
            </div>
            <div>
              <span>Due status</span>
              <strong>{selectedPayment.dueText}</strong>
            </div>
            <div>
              <span>Expected amount</span>
              <strong>{formatMoney(selectedPayment.expectedAmount)}</strong>
            </div>
            <div>
              <span>Received amount</span>
              <strong>{formatMoney(selectedPayment.receivedAmount)}</strong>
            </div>
            <div>
              <span>Variance</span>
              <strong>{formatMoney(selectedPayment.variance)}</strong>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Budgets" title="Wage and budget allocation">
            Mock split between practice, dispensary and ARRS budget areas.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "area", label: "Area" },
              { key: "budget", label: "Budget" },
              { key: "monthlyCost", label: "Monthly cost" },
              { key: "reclaimable", label: "Reclaimable" },
              { key: "status", label: "Status" },
            ]}
            rows={budgetAllocations}
            renderCell={(row, key) => {
              if (key === "area") return <strong>{row.area}</strong>;

              if (key === "monthlyCost" || key === "reclaimable") {
                return formatMoney(row[key]);
              }

              if (key === "budget" || key === "status") {
                return <Badge>{row[key]}</Badge>;
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Future uploads" title="Supplier invoice upload placeholders">
            Future version: upload supplier invoice files, extract line items,
            match against GPP/e-CASS reimbursement and flag losses.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "supplier", label: "Supplier" },
              { key: "invoiceMonth", label: "Month" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "note", label: "Note" },
            ]}
            rows={invoicePlaceholders}
            renderCell={(row, key) => {
              if (key === "supplier") return <strong>{row.supplier}</strong>;
              if (key === "amount") return formatMoney(row.amount);
              if (key === "status") return <Badge>{row.status}</Badge>;
              return row[key];
            }}
          />
        </Panel>
      </section>
    </>
  );
}
