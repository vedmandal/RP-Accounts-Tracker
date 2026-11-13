import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal, Table } from 'react-bootstrap';
import { useCustomers, useToast } from '../hooks/useContexts';
import { getCustomerCredit } from '../services/customerService';
import { getErrorMessage } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import Loader from './Loader';
import ConfirmModal from './ConfirmModal';

const statusBadge = (s) => <Badge bg={s === 'paid' ? 'success' : s === 'partial' ? 'warning' : 'danger'} text={s === 'partial' ? 'dark' : undefined}>{s}</Badge>;

const CustomerHistoryModal = ({ show, onHide, customerId, onReceive }) => {
  const { version, removePayment } = useCustomers();
  const { notify } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toReverse, setToReverse] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!show || !customerId) return;
    setError('');
    getCustomerCredit(customerId)
      .then(({ data: d }) => setData(d))
      .catch((err) => setError(getErrorMessage(err)));
  }, [show, customerId, version]);

  useEffect(() => {
    if (!show) setData(null);
  }, [show]);

  const reverse = async () => {
    setBusy(true);
    try {
      await removePayment(toReverse._id);
      setToReverse(null);
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const c = data?.customer;

  return (
    <>
      <Modal show={show && !toReverse} onHide={onHide} size="lg" centered scrollable>
        <Modal.Header closeButton><Modal.Title className="fs-5">{c ? `${c.name} — Credit History` : 'Credit History'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {!data && !error && <Loader />}
          {data && (
            <>
              <div className="d-flex flex-wrap gap-4 mb-3">
                <div><div className="text-muted small">Total Credit</div><strong>{formatCurrency(c.totalCredit)}</strong></div>
                <div><div className="text-muted small">Paid</div><strong className="text-success">{formatCurrency(c.totalPaid)}</strong></div>
                <div><div className="text-muted small">Outstanding</div><strong className="text-danger">{formatCurrency(c.outstandingBalance)}</strong></div>
                {c.phone && <div><div className="text-muted small">Phone</div>{c.phone}</div>}
              </div>
              <h6>Credit Sales</h6>
              {data.sales.length === 0 ? <div className="text-muted mb-3">No credit sales yet.</div> : (
                <div className="table-responsive mb-4">
                  <Table size="sm" className="mb-0">
                    <thead className="table-light"><tr><th>Date</th><th>Description</th><th className="text-end">Total</th><th className="text-end">Paid</th><th className="text-end">Pending</th><th>Status</th><th /></tr></thead>
                    <tbody>
                      {data.sales.map((s) => (
                        <tr key={s._id}>
                          <td className="text-nowrap">{formatDate(s.dateKey)}</td>
                          <td>{s.description}</td>
                          <td className="text-end">{formatCurrency(s.totalAmount)}</td>
                          <td className="text-end">{formatCurrency(s.paidAmount)}</td>
                          <td className="text-end">{formatCurrency(s.pendingAmount)}</td>
                          <td>{statusBadge(s.status)}</td>
                          <td className="text-end">{s.pendingAmount > 0 && <Button size="sm" variant="success" onClick={() => onReceive(s, c.name)}>Receive</Button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              <h6>Payment History</h6>
              {data.payments.length === 0 ? <div className="text-muted">No payments yet.</div> : (
                <div className="table-responsive">
                  <Table size="sm" className="mb-0">
                    <thead className="table-light"><tr><th>Date</th><th>For sale</th><th>Method</th><th className="text-end">Amount</th><th /></tr></thead>
                    <tbody>
                      {data.payments.map((p) => (
                        <tr key={p._id}>
                          <td className="text-nowrap">{formatDate(p.dateKey)}</td>
                          <td>{p.creditSale?.description || formatDate(p.creditSale?.dateKey)}{p.isInitial && <Badge bg="secondary" className="ms-1">at sale</Badge>}</td>
                          <td>{p.paymentMethod}</td>
                          <td className="text-end amount-in">{formatCurrency(p.amount)}</td>
                          <td className="text-end"><Button size="sm" variant="link" className="text-danger p-0" onClick={() => setToReverse(p)}>Reverse</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
      <ConfirmModal show={Boolean(toReverse)} title="Reverse payment" confirmText="Reverse" busy={busy} message={toReverse ? `Reverse the ${formatCurrency(toReverse.amount)} payment? The linked income record is removed and the balance is restored.` : ''} onConfirm={reverse} onCancel={() => setToReverse(null)} />
    </>
  );
};

export default CustomerHistoryModal;
