import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { useAuth } from '../hooks/useContexts';
import { getSetupStatus } from '../services/authService';
import { getErrorMessage } from '../services/api';
import Loader from '../components/Loader';

const LoginPage = () => {
  const { user, initialized, login, registerFirstAdmin } = useAuth();
  const location = useLocation();
  const [needsSetup, setNeedsSetup] = useState(null);
  const [setupError, setSetupError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSetupStatus = useCallback(() => {
    setNeedsSetup(null);
    setSetupError('');
    getSetupStatus()
      .then(({ data }) => setNeedsSetup(data.needsSetup))
      .catch(() => {
        setNeedsSetup(false);
        setSetupError('Unable to check account setup. Make sure the server and MongoDB are running, then try again.');
      });
  }, []);

  useEffect(() => {
    loadSetupStatus();
  }, [loadSetupStatus]);

  if (!initialized || needsSetup === null) return <Loader fullPage />;
  if (user) return <Navigate to={location.state?.from?.pathname || '/app'} replace />;

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (needsSetup) await registerFirstAdmin(form);
      else await login(form.email, form.password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <Card style={{ width: 400, maxWidth: '100%' }}>
        <Card.Body className="p-4">
          <h3 className="fw-bold text-center mb-1">RP Enterprises</h3>
          <p className="text-muted text-center mb-4">{needsSetup ? 'Register the first admin account to get started' : 'Sign in to continue'}</p>
          {setupError && (
            <Alert variant="danger" className="py-2">
              {setupError}{' '}
              <Button variant="link" className="p-0 align-baseline" onClick={loadSetupStatus}>Retry</Button>
            </Alert>
          )}
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Form onSubmit={submit}>
            {needsSetup && (
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control required value={form.name} onChange={set('name')} />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control required type="email" value={form.email} onChange={set('email')} autoComplete="username" />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control required type="password" minLength={6} value={form.password} onChange={set('password')} autoComplete={needsSetup ? 'new-password' : 'current-password'} />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={busy || !!setupError}>{busy ? 'Please wait...' : needsSetup ? 'Register Admin Account' : 'Login'}</Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;
