import { Card } from 'react-bootstrap';

const StatCard = ({ title, value, icon, variant = 'primary', hint }) => (
  <Card className="stat-card">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className={`stat-icon bg-${variant} bg-opacity-10 text-${variant}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-muted small">{title}</div>
        <div className={`stat-value ${variant === 'success' || variant === 'danger' ? `text-${variant}` : ''}`}>{value}</div>
        {hint && <div className="text-muted small">{hint}</div>}
      </div>
    </Card.Body>
  </Card>
);

export default StatCard;
