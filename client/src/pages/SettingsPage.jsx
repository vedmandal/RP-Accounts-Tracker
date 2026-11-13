import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row } from 'react-bootstrap';
import { FiTrash2 } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth, useToast, useTransactions } from '../hooks/useContexts';
import { register } from '../services/authService';
import { getErrorMessage } from '../services/api';

const CategoryList = ({ title, items, onDelete }) => (
  <Card className="h-100">
    <Card.Header>{title}</Card.Header>
    <ListGroup variant="flush">
      {items.map((c) => (
        <ListGroup.Item key={c._id} className="d-flex justify-content-between align-items-center">
          <span>{c.name}{c.isDefault && <Badge bg="light" text="dark" className="ms-2 border">default</Badge>}</span>
          {!c.isDefault && <Button variant="link" size="sm" className="text-danger p-0" onClick={() => onDelete(c)} aria-label="Delete"><FiTrash2 /></Button>}
        </ListGroup.Item>
      ))}
    </ListGroup>
  </Card>
);

const SettingsPage = () => {
  const { user } = useAuth();
  const { notify } = useToast();
  const { categories, addCategory, removeCategory } = useTransactions();
  const [cat, setCat] = useState({ name: '', type: 'income', expenseType: 'shop' });
  const [catError, setCatError] = useState('');
  const [usr, setUsr] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [usrError, setUsrError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const submitCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    try {
      await addCategory({ name: cat.name.trim(), type: cat.type, expenseType: cat.type === 'expense' ? cat.expenseType : undefined });
      setCat((c) => ({ ...c, name: '' }));
    } catch (err) {
      setCatError(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await removeCategory(toDelete._id);
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setUsrError('');
    try {
      await register(usr);
      notify(`User ${usr.email} created`);
      setUsr({ name: '', email: '', password: '', role: 'staff' });
    } catch (err) {
      setUsrError(getErrorMessage(err));
    }
  };

  const income = categories.filter((c) => c.type === 'income');
  const shop = categories.filter((c) => c.type === 'expense' && c.expenseType === 'shop');
  const home = categories.filter((c) => c.type === 'expense' && c.expenseType === 'home');

  return (
    <>
      <PageHeader title="Settings" subtitle="Categories and users" />

      <Card className="mb-4">
        <Card.Header>Account</Card.Header>
        <Card.Body>
          <div><strong>{user.name}</strong> · {user.email}</div>
          <div className="text-muted small">Role: {user.role}</div>
        </Card.Body>
      </Card>

      <h5 className="mb-3">Categories</h5>
      <Card className="mb-3">
        <Card.Body>
          {catError && <Alert variant="danger" className="py-2">{catError}</Alert>}
          <Form onSubmit={submitCategory}>
            <Row className="g-2 align-items-end">
              <Col md={4}><Form.Label className="small mb-1">Name</Form.Label><Form.Control required value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} maxLength={60} /></Col>
              <Col md={3}><Form.Label className="small mb-1">Type</Form.Label><Form.Select value={cat.type} onChange={(e) => setCat({ ...cat, type: e.target.value })}><option value="income">Income</option><option value="expense">Expense</option></Form.Select></Col>
              {cat.type === 'expense' && <Col md={3}><Form.Label className="small mb-1">Group</Form.Label><Form.Select value={cat.expenseType} onChange={(e) => setCat({ ...cat, expenseType: e.target.value })}><option value="shop">Shop expense</option><option value="home">Home expense</option></Form.Select></Col>}
              <Col md="auto"><Button type="submit">Add Category</Button></Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <Row className="g-3 mb-4">
        <Col lg={4}><CategoryList title="Income" items={income} onDelete={setToDelete} /></Col>
        <Col lg={4}><CategoryList title="Shop Expenses" items={shop} onDelete={setToDelete} /></Col>
        <Col lg={4}><CategoryList title="Home Expenses" items={home} onDelete={setToDelete} /></Col>
      </Row>

      {user.role === 'admin' && (
        <>
          <h5 className="mb-3">Add User</h5>
          <Card>
            <Card.Body>
              {usrError && <Alert variant="danger" className="py-2">{usrError}</Alert>}
              <Form onSubmit={submitUser}>
                <Row className="g-2 align-items-end">
                  <Col md={3}><Form.Label className="small mb-1">Name</Form.Label><Form.Control required value={usr.name} onChange={(e) => setUsr({ ...usr, name: e.target.value })} /></Col>
                  <Col md={3}><Form.Label className="small mb-1">Email</Form.Label><Form.Control required type="email" value={usr.email} onChange={(e) => setUsr({ ...usr, email: e.target.value })} /></Col>
                  <Col md={3}><Form.Label className="small mb-1">Password</Form.Label><Form.Control required type="password" minLength={6} value={usr.password} onChange={(e) => setUsr({ ...usr, password: e.target.value })} autoComplete="new-password" /></Col>
                  <Col md={2}><Form.Label className="small mb-1">Role</Form.Label><Form.Select value={usr.role} onChange={(e) => setUsr({ ...usr, role: e.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></Form.Select></Col>
                  <Col md="auto"><Button type="submit">Create</Button></Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </>
      )}

      <ConfirmModal show={Boolean(toDelete)} message={toDelete ? `Delete category "${toDelete.name}"? Categories used by existing transactions cannot be deleted.` : ''} busy={busy} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </>
  );
};

export default SettingsPage;
