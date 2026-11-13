import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Table } from 'react-bootstrap';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import PaginationBar from '../components/PaginationBar';
import ConfirmModal from '../components/ConfirmModal';
import CustomerModal from '../components/CustomerModal';
import { useCustomers, useToast } from '../hooks/useContexts';
import useDebounce from '../hooks/useDebounce';
import { getCustomers } from '../services/customerService';
import { getErrorMessage } from '../services/api';
import { formatCurrency } from '../utils/format';

const CustomersPage = () => {
  const { version, removeCustomer } = useCustomers();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [hasDues, setHasDues] = useState(false);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ items: [], pagination: null, loading: true, error: '' });
  const [modal, setModal] = useState({ show: false, customer: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounce(search, 400);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    getCustomers({ search: q, page, limit: 10, hasDues: hasDues ? 'true' : '' })
      .then((res) => !cancelled && setState({ items: res.data, pagination: res.pagination, loading: false, error: '' }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) })));
    return () => {
      cancelled = true;
    };
  }, [q, page, hasDues, version]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await removeCustomer(toDelete._id);
      setToDelete(null);
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Customers" subtitle="Customer details and what each one owes">
        <Button onClick={() => setModal({ show: true, customer: null })}><FiPlus className="me-1" />Add Customer</Button>
      </PageHeader>

      <Card className="mb-3">
        <Card.Body className="d-flex flex-wrap gap-3 align-items-center">
          <Form.Control style={{ maxWidth: 320 }} placeholder="Search name or phone" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Form.Check type="switch" id="dues" label="Only customers with pending dues" checked={hasDues} onChange={(e) => { setHasDues(e.target.checked); setPage(1); }} />
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {state.error && <Alert variant="danger">{state.error}</Alert>}
          {state.loading && !state.items.length ? (
            <Loader />
          ) : state.items.length === 0 ? (
            <div className="text-center text-muted py-5">No customers found.</div>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0">
                <thead className="table-light">
                  <tr><th>Name</th><th>Phone</th><th>Address</th><th className="text-end">Total Credit</th><th className="text-end">Paid</th><th className="text-end">Outstanding</th><th className="text-end">Actions</th></tr>
                </thead>
                <tbody>
                  {state.items.map((c) => (
                    <tr key={c._id}>
                      <td><Link to={`/app/credit?customer=${c._id}`} className="text-decoration-none fw-semibold">{c.name}</Link></td>
                      <td>{c.phone}</td>
                      <td className="text-truncate-2">{c.address}</td>
                      <td className="text-end">{formatCurrency(c.totalCredit)}</td>
                      <td className="text-end">{formatCurrency(c.totalPaid)}</td>
                      <td className="text-end">
                        {c.outstandingBalance > 0 ? <Badge bg="warning" text="dark">{formatCurrency(c.outstandingBalance)}</Badge> : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-end text-nowrap">
                        <Button variant="link" size="sm" className="p-1" onClick={() => setModal({ show: true, customer: c })} aria-label="Edit"><FiEdit2 /></Button>
                        <Button variant="link" size="sm" className="p-1 text-danger" onClick={() => setToDelete(c)} aria-label="Delete"><FiTrash2 /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          <PaginationBar pagination={state.pagination} onPage={setPage} />
        </Card.Body>
      </Card>

      <CustomerModal show={modal.show} customer={modal.customer} onHide={() => setModal({ show: false, customer: null })} />
      <ConfirmModal show={Boolean(toDelete)} message={toDelete ? `Delete customer "${toDelete.name}"? Customers with credit history cannot be deleted.` : ''} busy={busy} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </>
  );
};

export default CustomersPage;
