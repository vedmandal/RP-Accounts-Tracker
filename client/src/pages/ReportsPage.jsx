import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, ButtonGroup, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiDownload, FiFileText } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import TransactionTable from '../components/TransactionTable';
import { getReport } from '../services/reportService';
import { getErrorMessage } from '../services/api';
import { CHART_COLORS, PAYMENT_METHODS, PIE_COLORS } from '../utils/constants';
import { formatCurrency, todayKey } from '../utils/format';
import { FiTrendingDown, FiTrendingUp, FiDollarSign, FiList, FiArrowDownCircle, FiArrowUpCircle, FiSmartphone } from 'react-icons/fi';

const MODES = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom Range' },
];

const ReportsPage = () => {
  const today = todayKey();
  const [mode, setMode] = useState('monthly');
  const [f, setF] = useState({
    date: today,
    month: today.slice(0, 7),
    year: today.slice(0, 4),
    startDate: `${today.slice(0, 4)}-01-01`,
    endDate: today,
    type: '',
    paymentMethod: '',
    expenseType: '',
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Export libraries are large, so they load only when a download is requested.
  const download = async (kind) => {
    const { exportExcel, exportPDF } = await import('../utils/exporters');
    if (kind === 'excel') exportExcel(report);
    else exportPDF(report);
  };

  const set = (n) => (e) => setF((x) => ({ ...x, [n]: e.target.value }));

  const run = useCallback(async (m, v) => {
    const common = { type: v.type, paymentMethod: v.paymentMethod, expenseType: v.expenseType };
    let params;
    if (m === 'daily') params = { date: v.date, ...common };
    else if (m === 'monthly') {
      if (!v.month) return setError('Select a month');
      params = { year: v.month.slice(0, 4), month: String(Number(v.month.slice(5, 7))), ...common };
    } else if (m === 'yearly') params = { year: v.year, ...common };
    else {
      if (!v.startDate || !v.endDate) return setError('Select both start and end dates');
      if (v.startDate > v.endDate) return setError('Start date must be before end date');
      params = { startDate: v.startDate, endDate: v.endDate, ...common };
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await getReport(m, params);
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    return undefined;
  }, []);

  // Initial report (current month).
  useEffect(() => {
    run('monthly', f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = (e) => {
    e.preventDefault();
    run(mode, f);
  };

  const s = report?.summary;
  const pie = s ? s.byMethod.filter((m) => m.income > 0).map((m) => ({ name: m.method, value: m.income })) : [];
  const expCats = report ? report.byCategory.filter((c) => c.type === 'expense') : [];
  const incCats = report ? report.byCategory.filter((c) => c.type === 'income') : [];

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Daily, monthly, yearly and custom reports">
        {report && (
          <>
            <Button variant="outline-success" onClick={() => download('excel')}><FiDownload className="me-1" />Excel</Button>
            <Button variant="outline-danger" onClick={() => download('pdf')}><FiFileText className="me-1" />PDF</Button>
          </>
        )}
      </PageHeader>

      <Card className="mb-3">
        <Card.Body>
          <ButtonGroup className="mb-3">
            {MODES.map((m) => (
              <Button key={m.key} variant={mode === m.key ? 'primary' : 'outline-primary'} onClick={() => setMode(m.key)}>{m.label}</Button>
            ))}
          </ButtonGroup>
          <Form onSubmit={generate}>
            <Row className="g-2 align-items-end">
              {mode === 'daily' && <Col sm={6} md={3}><Form.Label className="small mb-1">Date</Form.Label><Form.Control type="date" value={f.date} onChange={set('date')} /></Col>}
              {mode === 'monthly' && <Col sm={6} md={3}><Form.Label className="small mb-1">Month</Form.Label><Form.Control type="month" value={f.month} onChange={set('month')} /></Col>}
              {mode === 'yearly' && <Col sm={6} md={3}><Form.Label className="small mb-1">Year</Form.Label><Form.Control type="number" min="1900" max="2200" value={f.year} onChange={set('year')} /></Col>}
              {mode === 'custom' && (
                <>
                  <Col sm={6} md={3}><Form.Label className="small mb-1">Start Date</Form.Label><Form.Control type="date" value={f.startDate} onChange={set('startDate')} /></Col>
                  <Col sm={6} md={3}><Form.Label className="small mb-1">End Date</Form.Label><Form.Control type="date" value={f.endDate} onChange={set('endDate')} /></Col>
                </>
              )}
              <Col sm={6} md={2}>
                <Form.Label className="small mb-1">Income / Expense</Form.Label>
                <Form.Select value={f.type} onChange={set('type')}><option value="">Both</option><option value="income">Income</option><option value="expense">Expense</option></Form.Select>
              </Col>
              <Col sm={6} md={2}>
                <Form.Label className="small mb-1">Payment Method</Form.Label>
                <Form.Select value={f.paymentMethod} onChange={set('paymentMethod')}><option value="">All</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Form.Select>
              </Col>
              <Col sm={6} md={2}>
                <Form.Label className="small mb-1">Expense Group</Form.Label>
                <Form.Select value={f.expenseType} onChange={set('expenseType')} disabled={f.type === 'income'}><option value="">Shop + Home</option><option value="shop">Shop</option><option value="home">Home</option></Form.Select>
              </Col>
              <Col sm={6} md="auto"><Button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Generate'}</Button></Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && !report && <Loader />}

      {report && (
        <>
          <h5 className="mb-3">{report.title}</h5>
          <Row className="g-3 mb-3">
            <Col sm={6} xl={3}><StatCard title="Total Income" value={formatCurrency(s.income)} variant="success" icon={<FiTrendingUp />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Total Expenses" value={formatCurrency(s.expense)} variant="danger" icon={<FiTrendingDown />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Net Balance" value={formatCurrency(s.net)} variant={s.net >= 0 ? 'success' : 'danger'} icon={<FiDollarSign />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Transactions" value={s.transactionCount} variant="primary" icon={<FiList />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Cash Received" value={formatCurrency(s.cashIncome)} variant="success" icon={<FiArrowDownCircle />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Online Received" value={formatCurrency(s.onlineIncome)} variant="success" icon={<FiSmartphone />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Cash Expenses" value={formatCurrency(s.cashExpense)} variant="danger" icon={<FiArrowUpCircle />} /></Col>
            <Col sm={6} xl={3}><StatCard title="Online Expenses" value={formatCurrency(s.onlineExpense)} variant="danger" icon={<FiSmartphone />} /></Col>
          </Row>

          {report.series.length > 0 && (
            <Row className="g-3 mb-3">
              <Col lg={pie.length ? 8 : 12}>
                <Card className="h-100">
                  <Card.Header>{report.mode === 'yearly' ? 'Monthly Comparison' : 'Income vs Expense'}</Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={report.series}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" interval="preserveStartEnd" />
                        <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill={CHART_COLORS.income} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill={CHART_COLORS.expense} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              {pie.length > 0 && (
                <Col lg={4}>
                  <Card className="h-100">
                    <Card.Header>Income by Payment Method</Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                            {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}

          {report.mode === 'yearly' && (
            <Card className="mb-3">
              <Card.Header>January – December Summary</Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table size="sm" hover className="mb-0">
                    <thead className="table-light"><tr><th>Month</th><th className="text-end">Income</th><th className="text-end">Expenses</th><th className="text-end">Net</th></tr></thead>
                    <tbody>
                      {report.series.map((m) => (
                        <tr key={m.key}><td>{m.label}</td><td className="text-end">{formatCurrency(m.income)}</td><td className="text-end">{formatCurrency(m.expense)}</td><td className={`text-end ${m.net < 0 ? 'text-danger' : ''}`}>{formatCurrency(m.net)}</td></tr>
                      ))}
                      <tr className="fw-bold table-light"><td>Total</td><td className="text-end">{formatCurrency(s.income)}</td><td className="text-end">{formatCurrency(s.expense)}</td><td className="text-end">{formatCurrency(s.net)}</td></tr>
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          <Row className="g-3 mb-3">
            {incCats.length > 0 && (
              <Col lg={6}>
                <Card className="h-100">
                  <Card.Header>Income by Category</Card.Header>
                  <Card.Body>
                    <Table size="sm" className="mb-0"><tbody>{incCats.map((c) => <tr key={c.category}><td>{c.category} <span className="text-muted small">({c.count})</span></td><td className="text-end amount-in">{formatCurrency(c.total)}</td></tr>)}</tbody></Table>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {expCats.length > 0 && (
              <Col lg={6}>
                <Card className="h-100">
                  <Card.Header>Expenses by Category</Card.Header>
                  <Card.Body>
                    <Table size="sm" className="mb-0">
                      <tbody>
                        {expCats.map((c) => (
                          <tr key={c.category}>
                            <td>{c.category} <span className="text-muted small">({c.expenseType}, {c.count})</span></td>
                            <td className="text-end amount-out">{formatCurrency(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {s.byMethod.length > 0 && (
              <Col xs={12}>
                <Card>
                  <Card.Header>Cash vs Online Breakdown</Card.Header>
                  <Card.Body>
                    <Table size="sm" className="mb-0">
                      <thead className="table-light"><tr><th>Method</th><th className="text-end">Income</th><th className="text-end">Expense</th></tr></thead>
                      <tbody>{s.byMethod.map((m) => <tr key={m.method}><td>{m.method}</td><td className="text-end">{formatCurrency(m.income)}</td><td className="text-end">{formatCurrency(m.expense)}</td></tr>)}</tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>

          {report.transactions.length > 0 && (
            <Card>
              <Card.Header>Transactions{report.truncated ? ' (first 1,000 shown; the export has the same limit)' : ''}</Card.Header>
              <Card.Body><TransactionTable items={report.transactions} showType /></Card.Body>
            </Card>
          )}
          {report.mode !== 'yearly' && report.transactions.length === 0 && <div className="text-center text-muted py-4">No transactions in this period.</div>}
        </>
      )}
    </>
  );
};

export default ReportsPage;
