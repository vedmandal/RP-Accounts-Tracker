import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// jsPDF's built-in fonts have no ₹ glyph, so PDFs use "Rs.".
const rs = (n) => `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)}`;

const fileName = (report) => report.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');

const summaryRows = (r) => {
  const s = r.summary;
  return [
    ['Total Income', s.income],
    ['Total Expenses', s.expense],
    ['Net Balance', s.net],
    ['Cash Received', s.cashIncome],
    ['Online Received', s.onlineIncome],
    ['Cash Expenses', s.cashExpense],
    ['Online Expenses', s.onlineExpense],
    ['Transactions', s.transactionCount],
  ];
};

const txnRow = (t) => ({
  Date: t.dateKey,
  Type: t.type,
  Details: t.type === 'income' ? t.customerName || '' : t.expenseName || '',
  Category: t.category,
  'Expense Type': t.expenseType || '',
  'Paid To': t.paidTo || '',
  Method: t.paymentMethod,
  Amount: t.amount,
  Notes: t.description || '',
});

export const exportExcel = (report) => {
  const wb = XLSX.utils.book_new();
  const head = [[report.title], [`Period: ${report.range.start} to ${report.range.end}`], []];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...head, ['Item', 'Value'], ...summaryRows(report)]), 'Summary');

  if (report.series.length) {
    const label = report.mode === 'yearly' ? 'Month' : 'Period';
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(report.series.map((x) => ({ [label]: x.label, Income: x.income, Expense: x.expense, Net: x.net }))),
      'Breakdown'
    );
  }
  if (report.byCategory.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(report.byCategory.map((c) => ({ Type: c.type, Category: c.category, 'Expense Type': c.expenseType || '', Total: c.total, Count: c.count }))),
      'Categories'
    );
  }
  if (report.summary.byMethod.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(report.summary.byMethod.map((m) => ({ Method: m.method, Income: m.income, Expense: m.expense }))),
      'Payment Methods'
    );
  }
  if (report.transactions.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.transactions.map(txnRow)), 'Transactions');
  }
  XLSX.writeFile(wb, `${fileName(report)}.xlsx`);
};

export const exportPDF = (report) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  let y = 40;
  doc.setFontSize(16);
  doc.text('RP Enterprises', 40, y);
  doc.setFontSize(12);
  y += 20;
  doc.text(report.title, 40, y);
  y += 16;
  doc.setFontSize(9);
  doc.text(`Period: ${report.range.start} to ${report.range.end}`, 40, y);

  const next = () => (doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : y + 12);
  const base = { theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [20, 33, 61] } };

  autoTable(doc, { ...base, startY: y + 12, head: [['Summary', 'Amount']], body: summaryRows(report).map(([k, v]) => [k, k === 'Transactions' ? String(v) : rs(v)]), columnStyles: { 1: { halign: 'right' } } });

  if (report.series.length) {
    autoTable(doc, {
      ...base,
      startY: next(),
      head: [[report.mode === 'yearly' ? 'Month' : 'Period', 'Income', 'Expense', 'Net']],
      body: report.series.map((x) => [x.label, rs(x.income), rs(x.expense), rs(x.net)]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
  }
  if (report.byCategory.length) {
    autoTable(doc, {
      ...base,
      startY: next(),
      head: [['Type', 'Category', 'Group', 'Count', 'Total']],
      body: report.byCategory.map((c) => [c.type, c.category, c.expenseType || '-', c.count, rs(c.total)]),
      columnStyles: { 4: { halign: 'right' } },
    });
  }
  if (report.transactions.length) {
    autoTable(doc, {
      ...base,
      startY: next(),
      head: [['Date', 'Type', 'Details', 'Category', 'Method', 'Amount']],
      body: report.transactions.map((t) => [t.dateKey, t.type, t.type === 'income' ? t.customerName || '' : t.expenseName || '', t.category, t.paymentMethod, rs(t.amount)]),
      columnStyles: { 5: { halign: 'right' } },
    });
  }
  doc.save(`${fileName(report)}.pdf`);
};
