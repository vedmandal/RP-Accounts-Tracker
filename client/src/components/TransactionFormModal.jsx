import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { useCustomers, useTransactions } from '../hooks/useContexts';
import { getErrorMessage } from '../services/api';
import { CREDIT_CATEGORY, PAYMENT_METHODS } from '../utils/constants';
import { todayKey, uid } from '../utils/format';

const blank = (type, date) => ({
  amount: '',
  category: '',
  paymentMethod: 'Cash',
  transactionDate: date || todayKey(),
  customerName: '',
  expenseName: '',
  paidTo: '',
  description: '',
});

// Add or edit an income / expense. `transaction` present = edit mode.
const TransactionFormModal = ({ show, onHide, type = 'income', transaction = null, defaultDate }) => {
  const { categories, createTransaction, updateTransaction } = useTransactions();
  const { options: customers } = useCustomers();
  const isEdit = Boolean(transaction);
  const kind = isEdit ? transaction.type : type;
  const [form, setForm] = useState(blank(kind, defaultDate));
  const [key, setKey] = useState(uid());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    setError('');
    setKey(uid()); // new idempotency key for each opened form -> double clicks cannot create duplicates
    if (transaction) {
      setForm({
        amount: String(transaction.amount),
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        transactionDate: transaction.dateKey,
        customerName: transaction.customerName || '',
        expenseName: transaction.expenseName || '',
        paidTo: transaction.paidTo || '',
        description: transaction.description || '',
      });
    } else {
      setForm(blank(kind, defaultDate));
    }
  }, [show, transaction, kind, defaultDate]);

  const options = categories.filter((c) => c.type === kind && c.name !== CREDIT_CATEGORY);
  const selected = categories.find((c) => c.type === kind && c.name === form.category);
  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const payload = {
      type: kind,
      amount: Number(form.amount),
      category: form.category,
      paymentMethod: form.paymentMethod,
      transactionDate: form.transactionDate,
      customerName: form.customerName.trim(),
      expenseName: form.expenseName.trim(),
      paidTo: form.paidTo.trim(),
      description: form.description.trim(),
    };
    try {
      if (isEdit) await updateTransaction(transaction._id, payload);
      else await createTransaction({ ...payload, idempotencyKey: key });
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const title = `${isEdit ? 'Edit' : 'Add'} ${kind === 'income' ? 'Income' : 'Expense'}`;

  return (
    <Modal show={show} onHide={busy ? undefined : onHide} centered backdrop="static">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Row className="g-3">
            {kind === 'expense' ? (
              <Col xs={12}>
                <Form.Label>Expense Name *</Form.Label>
                <Form.Control required value={form.expenseName} onChange={set('expenseName')} placeholder="e.g. October shop rent" maxLength={100} />
              </Col>
            ) : (
              <Col xs={12}>
                <Form.Label>Customer Name (optional)</Form.Label>
                <Form.Control value={form.customerName} onChange={set('customerName')} list="customer-names" maxLength={100} />
                <datalist id="customer-names">
                  {customers.map((c) => <option key={c._id} value={c.name} />)}
                </datalist>
              </Col>
            )}
            <Col xs={6}>
              <Form.Label>Amount (₹) *</Form.Label>
              <Form.Control required type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} autoFocus />
            </Col>
            <Col xs={6}>
              <Form.Label>Date *</Form.Label>
              <Form.Control required type="date" value={form.transactionDate} onChange={set('transactionDate')} />
            </Col>
            <Col xs={6}>
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select value={form.paymentMethod} onChange={set('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6}>
              <Form.Label>Category *</Form.Label>
              <Form.Select required value={form.category} onChange={set('category')}>
                <option value="">Select...</option>
                {kind === 'expense' ? (
                  ['shop', 'home'].map((t) => (
                    <optgroup key={t} label={t === 'shop' ? 'Shop Expenses' : 'Home Expenses'}>
                      {options.filter((c) => c.expenseType === t).map((c) => <option key={c._id}>{c.name}</option>)}
                    </optgroup>
                  ))
                ) : (
                  options.map((c) => <option key={c._id}>{c.name}</option>)
                )}
              </Form.Select>
              {kind === 'expense' && selected && (
                <Badge bg={selected.expenseType === 'shop' ? 'primary' : 'warning'} text={selected.expenseType === 'shop' ? undefined : 'dark'} className="mt-1">
                  {selected.expenseType === 'shop' ? 'Shop expense' : 'Home expense'}
                </Badge>
              )}
            </Col>
            {kind === 'expense' && (
              <Col xs={12}>
                <Form.Label>Paid To (optional)</Form.Label>
                <Form.Control value={form.paidTo} onChange={set('paidTo')} maxLength={100} />
              </Col>
            )}
            <Col xs={12}>
              <Form.Label>Description / Notes</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={set('description')} maxLength={500} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
          <Button type="submit" variant={kind === 'income' ? 'success' : 'danger'} disabled={busy}>
            {busy ? 'Saving...' : isEdit ? 'Save Changes' : `Add ${kind === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TransactionFormModal;
