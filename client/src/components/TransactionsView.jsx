import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { FiPlus } from 'react-icons/fi';
import PageHeader from './PageHeader';
import Loader from './Loader';
import StatCard from './StatCard';
import PaginationBar from './PaginationBar';
import ConfirmModal from './ConfirmModal';
import TransactionTable from './TransactionTable';
import TransactionFormModal from './TransactionFormModal';
import useTransactionList from '../hooks/useTransactionList';
import { useToast, useTransactions } from '../hooks/useContexts';
import { getErrorMessage } from '../services/api';
import { PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency } from '../utils/format';
import { FiTrendingDown, FiTrendingUp, FiList } from 'react-icons/fi';

const TransactionsView = ({ type }) => {
  const isIncome = type === 'income';
  const { categories, deleteTransaction } = useTransactions();
  const { notify } = useToast();
  const { filters, setFilter, setPage, items, pagination, totals, loading, error } = useTransactionList(type);
  const [form, setForm] = useState({ show: false, txn: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const cats = categories.filter((c) => c.type === type);
  const total = totals ? (isIncome ? totals.income : totals.expense) : 0;

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteTransaction(toDelete._id);
      setToDelete(null);
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={isIncome ? 'Income' : 'Expenses'} subtitle={isIncome ? 'Every customer payment as an individual record' : 'Shop and home expenses, kept separate'}>
        <Button variant={isIncome ? 'success' : 'danger'} onClick={() => setForm({ show: true, txn: null })}>
          <FiPlus className="me-1" />Add {isIncome ? 'Income' : 'Expense'}
        </Button>
      </PageHeader>

      <Row className="g-3 mb-3">
        <Col sm={6} lg={4}>
          <StatCard title={`Total ${isIncome ? 'Income' : 'Expenses'} (current filter)`} value={formatCurrency(total)} variant={isIncome ? 'success' : 'danger'} icon={isIncome ? <FiTrendingUp /> : <FiTrendingDown />} />
        </Col>
        <Col sm={6} lg={4}>
          <StatCard title="Records" value={totals ? (isIncome ? totals.incomeCount : totals.expenseCount) : 0} variant="primary" icon={<FiList />} />
        </Col>
      </Row>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={4}>
              <Form.Control placeholder={isIncome ? 'Search customer / notes' : 'Search name / paid to / notes'} value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
            </Col>
            <Col sm={6} md={2}>
              <Form.Select value={filters.paymentMethod} onChange={(e) => setFilter('paymentMethod', e.target.value)}>
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </Form.Select>
            </Col>
            <Col sm={6} md={3}>
              <Form.Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
                <option value="">All categories</option>
                {cats.map((c) => <option key={c._id}>{c.name}</option>)}
              </Form.Select>
            </Col>
            {!isIncome && (
              <Col sm={6} md={3}>
                <Form.Select value={filters.expenseType} onChange={(e) => setFilter('expenseType', e.target.value)}>
                  <option value="">Shop + Home</option>
                  <option value="shop">Shop only</option>
                  <option value="home">Home only</option>
                </Form.Select>
              </Col>
            )}
            <Col sm={6} md={3}>
              <Form.Select value={filters.period} onChange={(e) => setFilter('period', e.target.value)}>
                <option value="all">All dates</option>
                <option value="date">Specific date</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </Form.Select>
            </Col>
            {filters.period === 'date' && <Col sm={6} md={3}><Form.Control type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} /></Col>}
            {filters.period === 'month' && <Col sm={6} md={3}><Form.Control type="month" value={filters.month} onChange={(e) => setFilter('month', e.target.value)} /></Col>}
            {filters.period === 'year' && <Col sm={6} md={3}><Form.Control type="number" min="1900" max="2200" value={filters.year} onChange={(e) => setFilter('year', e.target.value)} /></Col>}
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading && !items.length ? (
            <Loader />
          ) : items.length === 0 ? (
            <div className="text-center text-muted py-5">No {type} records found for these filters.</div>
          ) : (
            <TransactionTable items={items} onEdit={(t) => setForm({ show: true, txn: t })} onDelete={setToDelete} />
          )}
          <PaginationBar pagination={pagination} onPage={setPage} />
        </Card.Body>
      </Card>

      <TransactionFormModal show={form.show} type={type} transaction={form.txn} onHide={() => setForm({ show: false, txn: null })} />
      <ConfirmModal
        show={Boolean(toDelete)}
        message={toDelete ? `Delete this ${formatCurrency(toDelete.amount)} ${type} record? Dashboard, reports and balances will update.` : ''}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
};

export default TransactionsView;
