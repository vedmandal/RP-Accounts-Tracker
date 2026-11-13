import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { useCustomers } from '../hooks/useContexts';
import { getErrorMessage } from '../services/api';
import { PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency, todayKey, uid } from '../utils/format';

const PaymentModal = ({ show, onHide, sale, customerName }) => {
  const { addPayment } = useCustomers();
  const [form, setForm] = useState({ amount: '', paymentMethod: 'Cash', paymentDate: todayKey(), note: '' });
  const [key, setKey] = useState(uid());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show || !sale) return;
    setError('');
    setKey(uid());
    setForm({ amount: String(sale.pendingAmount), paymentMethod: 'Cash', paymentDate: todayKey(), note: '' });
  }, [show, sale]);

  const set = (n) => (e) => setForm((f) => ({ ...f, [n]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (Number(form.amount) > sale.pendingAmount) {
      setError(`Amount cannot be more than the pending ${formatCurrency(sale.pendingAmount)}`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addPayment({ creditSale: sale._id, amount: Number(form.amount), paymentMethod: form.paymentMethod, paymentDate: form.paymentDate, note: form.note.trim(), idempotencyKey: key });
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
        <Modal.Header closeButton><Modal.Title className="fs-5">Receive Payment</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          {sale && (
            <Alert variant="light" className="border py-2 small">
              <strong>{customerName || sale.customer?.name}</strong>{sale.description ? ` · ${sale.description}` : ''}<br />
              Sale {formatCurrency(sale.totalAmount)} · Paid {formatCurrency(sale.paidAmount)} · <strong>Pending {formatCurrency(sale.pendingAmount)}</strong>
            </Alert>
          )}
          <Row className="g-3">
            <Col xs={6}><Form.Label>Amount (₹) *</Form.Label><Form.Control required type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} autoFocus /></Col>
            <Col xs={6}><Form.Label>Date *</Form.Label><Form.Control required type="date" value={form.paymentDate} onChange={set('paymentDate')} /></Col>
            <Col xs={12}><Form.Label>Payment Method *</Form.Label><Form.Select value={form.paymentMethod} onChange={set('paymentMethod')}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Form.Select></Col>
            <Col xs={12}><Form.Label>Note</Form.Label><Form.Control value={form.note} onChange={set('note')} maxLength={300} /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="success" disabled={busy}>{busy ? 'Saving...' : 'Record Payment'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PaymentModal;
