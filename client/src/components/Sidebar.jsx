import { NavLink } from 'react-router-dom';
import { FiBarChart2, FiCalendar, FiCreditCard, FiHome, FiLogOut, FiSettings, FiTrendingDown, FiTrendingUp, FiUsers, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../hooks/useContexts';

const LINKS = [
  { to: '/app', label: 'Dashboard', icon: <FiHome />, end: true },
  { to: '/app/income', label: 'Income', icon: <FiTrendingUp /> },
  { to: '/app/expenses', label: 'Expenses', icon: <FiTrendingDown /> },
  { to: '/app/calendar', label: 'Calendar', icon: <FiCalendar /> },
  { to: '/app/customers', label: 'Customers', icon: <FiUsers /> },
  { to: '/app/credit', label: 'Credit Management', icon: <FiCreditCard /> },
  { to: '/app/balances', label: 'Cash & Bank Balances', icon: <FiDollarSign /> },
  { to: '/app/reports', label: 'Reports', icon: <FiBarChart2 /> },
  { to: '/app/settings', label: 'Settings', icon: <FiSettings /> },
];

const Sidebar = ({ open, onClose }) => {
  const { logout } = useAuth();
  return (
    <>
      <aside className={`rp-sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="rp-brand-mark">RP</span>
          <span className="rp-brand-copy">RP Enterprises<small>Shop Management &amp; Finance</small></span>
        </div>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={onClose} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
              {l.icon}
              <span>{l.label}</span>
            </NavLink>
          ))}
          <button type="button" className="nav-item-link mt-2" onClick={logout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      <div className={`rp-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
    </>
  );
};

export default Sidebar;
