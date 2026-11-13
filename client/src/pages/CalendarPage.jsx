import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import TransactionTable from '../components/TransactionTable';
import TransactionFormModal from '../components/TransactionFormModal';
import { useToast, useTransactions } from '../hooks/useContexts';
import { getCalendarMonth, getDay } from '../services/transactionService';
import { getErrorMessage } from '../services/api';
import { dateToKey, formatCurrency, formatDate, MONTH_NAMES } from '../utils/format';
import { FiTrendingDown, FiTrendingUp, FiDollarSign } from 'react-icons/fi';

const CalendarPage = () => {
  const { version, deleteTransaction } = useTransactions();
  const { notify } = useToast();
  const [selected, setSelected] = useState(new Date());
  const [active, setActive] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [month, setMonth] = useState({ days: {}, summary: { income: 0, expense: 0, net: 0 } });
  const [day, setDay] = useState(null);
  const [error, setError] = useState('');
  const [loadingDay, setLoadingDay] = useState(true);
  const [form, setForm] = useState({ show: false, type: 'income', txn: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const year = active.getFullYear();
  const monthNum = active.getMonth() + 1;
  const dateKey = dateToKey(selected);

  useEffect(() => {
    getCalendarMonth(year, monthNum)
      .then(({ data }) => setMonth(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [year, monthNum, version]);

  useEffect(() => {
    let cancelled = false;
    setLoadingDay(true);
    getDay(dateKey)
      .then(({ data }) => !cancelled && setDay(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoadingDay(false));
    return () => {
      cancelled = true;
    };
  }, [dateKey, version]);

  const goTo = (y, m) => setActive(new Date(y, m, 1));
  const today = () => {
    const n = new Date();
    setSelected(n);
    goTo(n.getFullYear(), n.getMonth());
  };

  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= 2000; y -= 1) years.push(y);

  const income = day?.transactions.filter((t) => t.type === 'income') || [];
  const expense = day?.transactions.filter((t) => t.type === 'expense') || [];

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

  const openEdit = (t) => setForm({ show: true, type: t.type, txn: t });

  return (
    <>
      <PageHeader title="Calendar" subtitle="Browse the books for any date, month or year">
        <Button variant="outline-primary" onClick={today}>Today</Button>
        <Button variant="success" onClick={() => setForm({ show: true, type: 'income', txn: null })}><FiPlus className="me-1" />Income</Button>
        <Button variant="danger" onClick={() => setForm({ show: true, type: 'expense', txn: null })}><FiPlus className="me-1" />Expense</Button>
      </PageHeader>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="g-3">
        <Col lg={5}>
          <Card>
            <Card.Body>
              <Row className="g-2 mb-3">
                <Col xs={7}>
                  <Form.Select value={active.getMonth()} onChange={(e) => goTo(year, Number(e.target.value))}>
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={5}>
                  <Form.Select value={year} onChange={(e) => goTo(Number(e.target.value), active.getMonth())}>
                    {years.map((y) => <option key={y}>{y}</option>)}
                  </Form.Select>
                </Col>
              </Row>
              <Calendar
                value={selected}
                onChange={(d) => setSelected(d)}
                activeStartDate={active}
                onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActive(activeStartDate)}
                minDetail="decade"
                showNeighboringMonth={false}
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const d = month.days[dateToKey(date)];
                  if (!d) return null;
                  return (
                    <div className="cal-dots">
                      {d.income > 0 && <span className="dot dot-in" />}
                      {d.expense > 0 && <span className="dot dot-out" />}
                    </div>
                  );
                }}
              />
              <div className="small text-muted mt-2 d-flex gap-3">
                <span><span className="cal-dots d-inline-flex"><span className="dot dot-in" /></span> has income</span>
                <span><span className="cal-dots d-inline-flex"><span className="dot dot-out" /></span> has expenses</span>
              </div>
              <hr />
              <div className="fw-semibold mb-2">{MONTH_NAMES[monthNum - 1]} {year}</div>
              <div className="d-flex justify-content-between"><span className="text-muted">Income</span><span className="amount-in">{formatCurrency(month.summary.income)}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Expenses</span><span className="amount-out">{formatCurrency(month.summary.expense)}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Net</span><strong>{formatCurrency(month.summary.net)}</strong></div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <h5 className="mb-3">{formatDate(dateKey)}</h5>
          {loadingDay && !day ? (
            <Loader />
          ) : (
            <>
              <Row className="g-3 mb-3">
                <Col sm={4}><StatCard title="Income" value={formatCurrency(day?.summary.income)} variant="success" icon={<FiTrendingUp />} /></Col>
                <Col sm={4}><StatCard title="Expenses" value={formatCurrency(day?.summary.expense)} variant="danger" icon={<FiTrendingDown />} /></Col>
                <Col sm={4}><StatCard title="Net Balance" value={formatCurrency(day?.summary.net)} variant={(day?.summary.net || 0) >= 0 ? 'success' : 'danger'} icon={<FiDollarSign />} /></Col>
              </Row>
              <Card className="mb-3">
                <Card.Header className="text-success">Income ({income.length})</Card.Header>
                <Card.Body>
                  {income.length === 0 ? <div className="text-muted">No income on this date.</div> : <TransactionTable items={income} showDate={false} onEdit={openEdit} onDelete={setToDelete} />}
                </Card.Body>
              </Card>
              <Card>
                <Card.Header className="text-danger">Expenses ({expense.length})</Card.Header>
                <Card.Body>
                  {expense.length === 0 ? <div className="text-muted">No expenses on this date.</div> : <TransactionTable items={expense} showDate={false} onEdit={openEdit} onDelete={setToDelete} />}
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      <TransactionFormModal show={form.show} type={form.type} transaction={form.txn} defaultDate={dateKey} onHide={() => setForm((f) => ({ ...f, show: false }))} />
      <ConfirmModal
        show={Boolean(toDelete)}
        message={toDelete ? `Delete this ${formatCurrency(toDelete.amount)} ${toDelete.type} record?` : ''}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
};

export default CalendarPage;
