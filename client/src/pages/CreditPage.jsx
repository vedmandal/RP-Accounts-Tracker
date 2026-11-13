import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Form, Nav, Row, Table } from 'react-bootstrap';
import { FiPlus, FiUsers, FiCreditCard } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import PaginationBar from '../components/PaginationBar';
import CreditSaleModal from '../components/CreditSaleModal';
import PaymentModal from '../components/PaymentModal';
import CustomerHistoryModal from '../components/CustomerHistoryModal';
import { useCustomers } from '../hooks/useContexts';
import { getCreditSales, getCreditSummary, getCustomers } from '../services/customerService';
import { getErrorMessage } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

const CreditPage = () => {
  const { version } = useCustomers();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('sales');
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ totalPending: 0, customersWithDues: 0 });
  const [sales, setSales] = useState({ items: [], pagination: null, loading: true });
  const [owing, setOwing] = useState({ items: [], loading: true });
  const [error, setError] = useState('');
  const [saleModal, setSaleModal] = useState({ show: false, customer: '' });
  const [pay, setPay] = useState({ show: false, sale: null, name: '' });
  const [history, setHistory] = useState({ show: false, id: params.get('customer') || null });

  useEffect(() => {
    if (params.get('customer')) setHistory({ show: true, id: params.get('customer') });
  }, [params]);

  useEffect(() => {
    getCreditSummary().then(({ data }) => setSummary(data)).catch(() => {});
  }, [version]);

  useEffect(() => {
    if (tab !== 'sales') return undefined;
    let cancelled = false;
    setSales((s) => ({ ...s, loading: true }));
    getCreditSales({ status, page, limit: 10 })
      .then((res) => !cancelled && setSales({ items: res.data, pagination: res.pagination, loading: false }))
      .catch((err) => { if (!cancelled) { setError(getErrorMessage(err)); setSales((s) => ({ ...s, loading: false })); } });
    return () => { cancelled = true; };
  }, [tab, status, page, version]);

  useEffect(() => {
    if (tab !== 'customers') return undefined;
    let cancelled = false;
    setOwing((s) => ({ ...s, loading: true }));
    getCustomers({ hasDues: 'true', limit: 200 })
      .then((res) => !cancelled && setOwing({ items: res.data, loading: false }))
      .catch((err) => { if (!cancelled) { setError(getErrorMessage(err)); setOwing((s) => ({ ...s, loading: false })); } });
    return () => { cancelled = true; };
  }, [tab, version]);

  const receiveFromHistory = (sale, name) => {
    setHistory((h) => ({ ...h, show: false }));
    setPay({ show: true, sale, name });
  };

  return (
    <>
      <PageHeader title="Credit Management" subtitle="Credit sales, pending amounts and partial payments">
        <Button onClick={() => setSaleModal({ show: true, customer: '' })}><FiPlus className="me-1" />New Credit Sale</Button>
      </PageHeader>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="g-3 mb-3">
        <Col sm={6}><StatCard title="Total Pending Payments" value={formatCurrency(summary.totalPending)} variant="warning" icon={<FiCreditCard />} /></Col>
        <Col sm={6}><StatCard title="Customers With Dues" value={summary.customersWithDues} variant="primary" icon={<FiUsers />} /></Col>
      </Row>

      <Card>
        <Card.Header>
          <Nav variant="pills" activeKey={tab} onSelect={(k) => { setTab(k); setPage(1); }}>
            <Nav.Item><Nav.Link eventKey="sales">Credit Sales</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="customers">Customer-wise Outstanding</Nav.Link></Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          {tab === 'sales' && (
            <>
              <Form.Select className="mb-3" style={{ maxWidth: 220 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="pending">Pending only</option>
                <option value="paid">Fully paid</option>
                <option value="">All sales</option>
              </Form.Select>
              {sales.loading && !sales.items.length ? <Loader /> : sales.items.length === 0 ? (
                <div className="text-center text-muted py-5">No credit sales found.</div>
              ) : (
                <div className="table-responsive">
                  <Table hover size="sm" className="mb-0">
                    <thead className="table-light"><tr><th>Date</th><th>Customer</th><th>Description</th><th className="text-end">Total</th><th className="text-end">Paid</th><th className="text-end">Pending</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                    <tbody>
                      {sales.items.map((s) => (
                        <tr key={s._id}>
                          <td className="text-nowrap">{formatDate(s.dateKey)}</td>
                          <td>{s.customer?.name}</td>
                          <td className="text-truncate-2">{s.description}</td>
                          <td className="text-end">{formatCurrency(s.totalAmount)}</td>
                          <td className="text-end">{formatCurrency(s.paidAmount)}</td>
                          <td className="text-end fw-semibold">{formatCurrency(s.pendingAmount)}</td>
                          <td><Badge bg={s.status === 'paid' ? 'success' : s.status === 'partial' ? 'warning' : 'danger'} text={s.status === 'partial' ? 'dark' : undefined}>{s.status}</Badge></td>
                          <td className="text-end text-nowrap">
                            {s.pendingAmount > 0 && <Button size="sm" variant="success" className="me-1" onClick={() => setPay({ show: true, sale: s, name: s.customer?.name })}>Receive</Button>}
                            <Button size="sm" variant="outline-secondary" onClick={() => setHistory({ show: true, id: s.customer?._id })}>History</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              <PaginationBar pagination={sales.pagination} onPage={setPage} />
            </>
          )}

          {tab === 'customers' && (owing.loading && !owing.items.length ? <Loader /> : owing.items.length === 0 ? (
            <div className="text-center text-muted py-5">Nobody owes you anything right now. 🎉</div>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0">
                <thead className="table-light"><tr><th>Customer</th><th>Phone</th><th className="text-end">Total Credit</th><th className="text-end">Paid</th><th className="text-end">Outstanding</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {owing.items.map((c) => (
                    <tr key={c._id}>
                      <td className="fw-semibold">{c.name}</td>
                      <td>{c.phone}</td>
                      <td className="text-end">{formatCurrency(c.totalCredit)}</td>
                      <td className="text-end">{formatCurrency(c.totalPaid)}</td>
                      <td className="text-end text-danger fw-semibold">{formatCurrency(c.outstandingBalance)}</td>
                      <td className="text-end text-nowrap">
                        <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => setHistory({ show: true, id: c._id })}>History / Receive</Button>
                        <Button size="sm" variant="outline-primary" onClick={() => setSaleModal({ show: true, customer: c._id })}>New Sale</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ))}
        </Card.Body>
      </Card>

      <CreditSaleModal show={saleModal.show} defaultCustomer={saleModal.customer} onHide={() => setSaleModal({ show: false, customer: '' })} />
      <PaymentModal show={pay.show} sale={pay.sale} customerName={pay.name} onHide={() => setPay({ show: false, sale: null, name: '' })} />
      <CustomerHistoryModal show={history.show} customerId={history.id} onHide={() => setHistory((h) => ({ ...h, show: false }))} onReceive={receiveFromHistory} />
    </>
  );
};

export default CreditPage;
