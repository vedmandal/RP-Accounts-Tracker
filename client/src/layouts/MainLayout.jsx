import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button, Dropdown } from 'react-bootstrap';
import { FiMenu, FiUser } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useContexts';
import { formatDate, todayKey } from '../utils/format';

const MainLayout = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="rp-main">
        <header className="rp-topbar d-flex align-items-center justify-content-between px-3 py-2">
          <div className="d-flex align-items-center gap-2">
            <Button variant="light" className="d-lg-none" onClick={() => setOpen(true)} aria-label="Open menu"><FiMenu /></Button>
            <Link to="/" className="fw-semibold d-none d-sm-inline text-dark text-decoration-none">RP Enterprises</Link>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small d-none d-md-inline">{formatDate(todayKey())}</span>
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" size="sm"><FiUser className="me-1" />{user?.name}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.ItemText className="small text-muted">{user?.email}<br />Role: {user?.role}</Dropdown.ItemText>
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>
        <main className="rp-content">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default MainLayout;
