import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiArrowDownCircle, FiArrowUpCircle, FiCreditCard, FiDollarSign, FiList, FiPlus, FiSmartphone, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { useDashboard } from '../hooks/useContexts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import TransactionFormModal from '../components/TransactionFormModal';
import { CHART_COLORS, PIE_COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/format';

const RecentList = ({ title, items, type }) => (
  <Card className="h-100">
    <Card.Header>{title}</Card.Header>
    <Card.Body className="p-0">
      {items.length === 0 ? (
        <div className="text-muted text-center py-4">No records yet</div>
      ) : (
        <Table size="sm" hover className="mb-0">
          <tbody>
            {items.map((t) => (
              <tr key={t._id}>
                <td className="ps-3">
                  <div>{type === 'income' ? t.customerName || t.category : t.expenseName}</div>
                  <div className="small text-muted">{formatDate(t.dateKey)} · {t.paymentMethod}</div>
                </td>
                <td className={`text-end pe-3 ${type === 'income' ? 'amount-in' : 'amount-out'}`}>{formatCurrency(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card.Body>
  </Card>
);

const DashboardPage = () => {
  const { summary, recent, loading, error, version, refresh } = useDashboard();
  const [modal, setModal] = useState({ show: false, type: 'income' });

  // Fetch on open, and again whenever any context reports a change in money records.
  useEffect(() => {
    refresh();
  }, [version, refresh]);

  const open = (type) => setModal({ show: true, type });

  if (!summary && loading) return <Loader />;
  if (!summary) return <Alert variant="danger">{error || 'Could not load dashboard'}</Alert>;

  const t = summary.today;
  const pie = t.byMethod.filter((m) => m.income > 0).map((m) => ({ name: m.method, value: m.income }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Today · ${formatDate(summary.date)}`}>
        <Button variant="success" onClick={() => open('income')}><FiPlus className="me-1" />Quick Add Income</Button>
        <Button variant="danger" onClick={() => open('expense')}><FiPlus className="me-1" />Quick Add Expense</Button>
      </PageHeader>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-3">
        <Col sm={6} xl={3}><StatCard title="Total Income Today" value={formatCurrency(t.income)} variant="success" icon={<FiTrendingUp />} /></Col>
        <Col sm={6} xl={3}><StatCard title="Total Expenses Today" value={formatCurrency(t.expense)} variant="danger" icon={<FiTrendingDown />} /></Col>
        <Col sm={6} xl={3}><StatCard title="Today's Net Balance" value={formatCurrency(t.net)} variant={t.net >= 0 ? 'success' : 'danger'} icon={<FiDollarSign />} /></Col>
        <Col sm={6} xl={3}><StatCard title="Today's Transactions" value={t.transactionCount} hint={`${t.incomeCount} income · ${t.expenseCount} expense`} variant="primary" icon={<FiList />} /></Col>
      </Row>
      <Row className="g-3 mb-3">
        <Col sm={6} xl={3}><StatCard title="Cash Received" value={formatCurrency(t.cashIncome)} variant="success" icon={<FiArrowDownCircle />} /></Col>
        <Col sm={6} xl={3}><StatCard title="Online Received" value={formatCurrency(t.onlineIncome)} variant="success" icon={<FiSmartphone />} /></Col>
        <Col sm={6} xl={3}><StatCard title="Cash Expenses" value={formatCurrency(t.cashExpense)} variant="danger" icon={<FiArrowUpCircle />} /></Col>
        <Col sm={6} xl={3}><StatCard title="Online Expenses" value={formatCurrency(t.onlineExpense)} variant="danger" icon={<FiSmartphone />} /></Col>
      </Row>
      <Row className="g-3 mb-3">
        <Col md={4}><StatCard title="Cash in Hand" value={formatCurrency(summary.balances.totals.cash)} variant="primary" icon={<FiDollarSign />} /></Col>
        <Col md={4}><StatCard title="Online Balance (UPI + Bank)" value={formatCurrency(summary.balances.totals.online)} variant="primary" icon={<FiSmartphone />} /></Col>
        <Col md={4}><StatCard title="Customers Owe You" value={formatCurrency(summary.pendingCredit.totalPending)} hint={`${summary.pendingCredit.customersWithDues} customers`} variant="warning" icon={<FiCreditCard />} /></Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={8}>
          <Card className="h-100">
            <Card.Header>Monthly Income vs Expense ({summary.date.slice(0, 4)})</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>Payment Methods (Today's Income)</Card.Header>
            <Card.Body>
              {pie.length === 0 ? (
                <div className="text-muted text-center py-5">No income recorded today</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                      {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}><RecentList title="Recent Income" items={recent?.income || []} type="income" /></Col>
        <Col lg={6}><RecentList title="Recent Expenses" items={recent?.expense || []} type="expense" /></Col>
      </Row>

      <TransactionFormModal show={modal.show} type={modal.type} onHide={() => setModal((m) => ({ ...m, show: false }))} />
    </>
  );
};

export default DashboardPage;
