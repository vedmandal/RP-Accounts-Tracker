const PageHeader = ({ title, subtitle, children }) => (
  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
    <div>
      <h4 className="mb-0 fw-bold">{title}</h4>
      {subtitle && <div className="text-muted small">{subtitle}</div>}
    </div>
    <div className="d-flex flex-wrap gap-2">{children}</div>
  </div>
);

export default PageHeader;
