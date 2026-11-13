import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { useCustomers } from '../hooks/useContexts';
import { getErrorMessage } from '../services/api';
import { PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency, todayKey, uid } from '../utils/format';
import CustomerModal from './CustomerModal';

const CreditSaleModal = ({ show, onHide, defaultCustomer = '' }) => {
  const { options: customers, addSale } = useCustomers();
  const [form, setForm] = useState({ customer: '', totalAmount: '', paidAmount: '', paymentMethod: 'Cash', saleDate: todayKey(), description: '' });
  const [key, setKey] = useState(uid());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newCustomer, setNewCustomer] = useState(false);

  useEffect(() => {
    if (!show) return;
    setError('');
    setKey(uid());
    setForm({ customer: defaultCustomer, totalAmount: '', paidAmount: '', paymentMethod: 'Cash', saleDate: todayKey(), description: '' });
  }, [show, defaultCustomer]);

  const set = (n) => (e) => setForm((f) => ({ ...f, [n]: e.target.value }));
  const total = Number(form.totalAmount) || 0;
  const paid = Number(form.paidAmount) || 0;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (paid > total) {
      setError('Paid amount cannot be more than the sale total');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addSale({
        customer: form.customer,
        totalAmount: total,
        paidAmount: paid,
        paymentMethod: paid > 0 ? form.paymentMethod : undefined,
        saleDate: form.saleDate,
        description: form.description.trim(),
        idempotencyKey: key,
      });
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal show={show && !newCustomer} onHide={busy ? undefined : onHide} centered backdrop="static">
        <Form onSubmit={submit}>
          <Modal.Header closeButton><Modal.Title className="fs-5">New Credit Sale</Modal.Title></Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label>Customer *</Form.Label>
                <InputGroup>
                  <Form.Select required value={form.customer} onChange={set('customer')}>
                    <option value="">Select customer...</option>
                    {customers.map((c) => <option key={c._id} value={c._id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                  </Form.Select>
                  <Button variant="outline-primary" onClick={() => setNewCustomer(true)}>New</Button>
                </InputGroup>
              </Col>
              <Col xs={6}><Form.Label>Total Sale (₹) *</Form.Label><Form.Control required type="number" min="0.01" step="0.01" value={form.totalAmount} onChange={set('totalAmount')} /></Col>
              <Col xs={6}><Form.Label>Paid Now (₹)</Form.Label><Form.Control type="number" min="0" step="0.01" value={form.paidAmount} onChange={set('paidAmount')} placeholder="0" /></Col>
              {paid > 0 && (
                <Col xs={6}>
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select value={form.paymentMethod} onChange={set('paymentMethod')}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Form.Select>
                </Col>
              )}
              <Col xs={paid > 0 ? 6 : 12}><Form.Label>Sale Date *</Form.Label><Form.Control required type="date" value={form.saleDate} onChange={set('saleDate')} /></Col>
              <Col xs={12}><Form.Label>Description</Form.Label><Form.Control value={form.description} onChange={set('description')} maxLength={500} placeholder="e.g. Wedding cards 500 pcs" /></Col>
              <Col xs={12}>
                <Alert variant="light" className="mb-0 py-2 small border">
                  Pending after this sale: <strong>{formatCurrency(Math.max(total - paid, 0))}</strong>. Only the paid part is counted as income; the rest is counted when collected.
                </Alert>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save Sale'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <CustomerModal show={show && newCustomer} onHide={() => setNewCustomer(false)} onSaved={(c) => setForm((f) => ({ ...f, customer: c._id }))} />
    </>
  );
};

export default CreditSaleModal;
