import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { FiRepeat, FiEdit3 } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import { useBalances } from '../hooks/useContexts';
import { getErrorMessage } from '../services/api';
import { ACCOUNT_LABELS } from '../utils/constants';
import { formatCurrency, formatDate, todayKey, uid } from '../utils/format';

const ACCOUNTS = ['cash', 'upi', 'bank'];

const OpeningModal = ({ show, onHide, account, current }) => {
  const { setOpening } = useBalances();
  const [form, setForm] = useState({ accountType: 'cash', openingBalance: '', openingDate: todayKey() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    setError('');
    const acc = current?.find((a) => a.accountType === account);
    setForm({ accountType: account || 'cash', openingBalance: acc ? String(acc.openingBalance) : '', openingDate: todayKey() });
  }, [show, account, current]);

  const set = (n) => (e) => setForm((f) => ({ ...f, [n]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await setOpening({ ...form, openingBalance: Number(form.openingBalance) });
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={show} onHide={busy ? undefined : onHide} centered backdrop="static">
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title className="fs-5">Set Opening Balance</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Form.Group className="mb-3"><Form.Label>Account</Form.Label>
            <Form.Select value={form.accountType} onChange={set('accountType')}>{ACCOUNTS.map((a) => <option key={a} value={a}>{ACCOUNT_LABELS[a]}</option>)}</Form.Select>
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Opening Balance (₹)</Form.Label><Form.Control required type="number" step="0.01" value={form.openingBalance} onChange={set('openingBalance')} autoFocus /></Form.Group>
          <Form.Group><Form.Label>As of date</Form.Label><Form.Control required type="date" value={form.openingDate} onChange={set('openingDate')} />
            <Form.Text>Only transactions from this date onwards are added to the opening balance.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button></Modal.Footer>
      </Form>
    </Modal>
  );
};

const TransferModal = ({ show, onHide }) => {
  const { transfer } = useBalances();
  const [form, setForm] = useState({ fromAccount: 'cash', toAccount: 'bank', amount: '', transferDate: todayKey(), note: '' });
  const [key, setKey] = useState(uid());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    setError('');
    setKey(uid());
    setForm({ fromAccount: 'cash', toAccount: 'bank', amount: '', transferDate: todayKey(), note: '' });
  }, [show]);

  const set = (n) => (e) => setForm((f) => ({ ...f, [n]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await transfer({ ...form, amount: Number(form.amount), idempotencyKey: key });
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={show} onHide={busy ? undefined : onHide} centered backdrop="static">
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title className="fs-5">Transfer Between Accounts</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Row className="g-3">
            <Col xs={6}><Form.Label>From</Form.Label><Form.Select value={form.fromAccount} onChange={set('fromAccount')}>{ACCOUNTS.map((a) => <option key={a} value={a}>{ACCOUNT_LABELS[a]}</option>)}</Form.Select></Col>
            <Col xs={6}><Form.Label>To</Form.Label><Form.Select value={form.toAccount} onChange={set('toAccount')}>{ACCOUNTS.map((a) => <option key={a} value={a}>{ACCOUNT_LABELS[a]}</option>)}</Form.Select></Col>
            <Col xs={6}><Form.Label>Amount (₹)</Form.Label><Form.Control required type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} autoFocus /></Col>
            <Col xs={6}><Form.Label>Date</Form.Label><Form.Control required type="date" value={form.transferDate} onChange={set('transferDate')} /></Col>
            <Col xs={12}><Form.Label>Note</Form.Label><Form.Control value={form.note} onChange={set('note')} maxLength={300} /></Col>
            <Col xs={12}><div className="small text-muted">Transfers move money between your accounts. They are never counted as income or expenses.</div></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer><Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Transfer'}</Button></Modal.Footer>
      </Form>
    </Modal>
  );
};

const BalancesPage = () => {
  const { balances, history, loading, error, version, load } = useBalances();
  const [opening, setOpening] = useState({ show: false, account: 'cash' });
  const [transfer, setTransfer] = useState(false);

  useEffect(() => {
    load();
  }, [version, load]);

  if (!balances && loading) return <Loader />;
  if (!balances) return <Alert variant="danger">{error || 'Could not load balances'}</Alert>;

  return (
    <>
      <PageHeader title="Cash & Bank Balances" subtitle="Closing balance = opening + income − expenses ± transfers">
        <Button variant="outline-primary" onClick={() => setOpening({ show: true, account: 'cash' })}><FiEdit3 className="me-1" />Opening Balance</Button>
        <Button onClick={() => setTransfer(true)}><FiRepeat className="me-1" />Transfer</Button>
      </PageHeader>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-3">
        {balances.accounts.map((a) => (
          <Col md={4} key={a.accountType}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="text-muted">{ACCOUNT_LABELS[a.accountType]}</div>
                  <Button variant="link" size="sm" className="p-0" onClick={() => setOpening({ show: true, account: a.accountType })}>Set opening</Button>
                </div>
                <div className={`fs-3 fw-bold ${a.currentBalance < 0 ? 'text-danger' : ''}`}>{formatCurrency(a.currentBalance)}</div>
                <hr />
                <div className="small">
                  <div className="d-flex justify-content-between"><span className="text-muted">Opening{a.openingDate !== '1970-01-01' ? ` (${formatDate(a.openingDate)})` : ''}</span><span>{formatCurrency(a.openingBalance)}</span></div>
                  <div className="d-flex justify-content-between"><span className="text-muted">+ Income</span><span className="text-success">{formatCurrency(a.income)}</span></div>
                  <div className="d-flex justify-content-between"><span className="text-muted">− Expenses</span><span className="text-danger">{formatCurrency(a.expense)}</span></div>
                  <div className="d-flex justify-content-between"><span className="text-muted">+ Transfers in</span><span>{formatCurrency(a.transferIn)}</span></div>
                  <div className="d-flex justify-content-between"><span className="text-muted">− Transfers out</span><span>{formatCurrency(a.transferOut)}</span></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-3">
        <Col md={4}><Card><Card.Body><div className="text-muted small">Total Cash</div><div className="fs-5 fw-bold">{formatCurrency(balances.totals.cash)}</div></Card.Body></Card></Col>
        <Col md={4}><Card><Card.Body><div className="text-muted small">Total Online (UPI + Bank)</div><div className="fs-5 fw-bold">{formatCurrency(balances.totals.online)}</div></Card.Body></Card></Col>
        <Col md={4}><Card><Card.Body><div className="text-muted small">Total Available</div><div className="fs-5 fw-bold">{formatCurrency(balances.totals.total)}</div></Card.Body></Card></Col>
      </Row>
      <Alert variant="light" className="border small">"Other" payment method entries are counted in the Bank account.</Alert>

      <Card>
        <Card.Header>Balance History</Card.Header>
        <Card.Body>
          {history.length === 0 ? <div className="text-muted text-center py-4">No transfers or opening balances yet.</div> : (
            <div className="table-responsive">
              <Table size="sm" hover className="mb-0">
                <thead className="table-light"><tr><th>Date</th><th>Type</th><th>Details</th><th className="text-end">Amount</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={`${h.kind}-${h.id}`}>
                      <td className="text-nowrap">{formatDate(h.date)}</td>
                      <td><Badge bg={h.kind === 'transfer' ? 'info' : 'secondary'}>{h.kind === 'transfer' ? 'Transfer' : 'Opening balance'}</Badge></td>
                      <td>{h.kind === 'transfer' ? `${ACCOUNT_LABELS[h.fromAccount]} → ${ACCOUNT_LABELS[h.toAccount]}${h.note ? ` · ${h.note}` : ''}` : ACCOUNT_LABELS[h.accountType]}</td>
                      <td className="text-end">{formatCurrency(h.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <OpeningModal show={opening.show} account={opening.account} current={balances.accounts} onHide={() => setOpening((o) => ({ ...o, show: false }))} />
      <TransferModal show={transfer} onHide={() => setTransfer(false)} />
    </>
  );
};

export default BalancesPage;
