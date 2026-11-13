import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useCustomers } from '../hooks/useContexts';
import { getErrorMessage } from '../services/api';

const CustomerModal = ({ show, onHide, customer = null, onSaved }) => {
  const { addCustomer, editCustomer } = useCustomers();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    setError('');
    setForm({ name: customer?.name || '', phone: customer?.phone || '', address: customer?.address || '' });
  }, [show, customer]);

  const set = (n) => (e) => setForm((f) => ({ ...f, [n]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (customer) await editCustomer(customer._id, form);
      else {
        const created = await addCustomer(form);
        onSaved?.(created);
      }
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
        <Modal.Header closeButton><Modal.Title className="fs-5">{customer ? 'Edit Customer' : 'Add Customer'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Form.Group className="mb-3"><Form.Label>Name *</Form.Label><Form.Control required value={form.name} onChange={set('name')} maxLength={100} autoFocus /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={set('phone')} maxLength={20} /></Form.Group>
          <Form.Group><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={2} value={form.address} onChange={set('address')} maxLength={300} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CustomerModal;
