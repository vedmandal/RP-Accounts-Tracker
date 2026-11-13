import { Pagination } from 'react-bootstrap';

const PaginationBar = ({ pagination, onPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const nums = [];
  for (let i = start; i <= end; i += 1) nums.push(i);
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3">
      <small className="text-muted">{total} records</small>
      <Pagination size="sm" className="mb-0">
        <Pagination.Prev disabled={page === 1} onClick={() => onPage(page - 1)} />
        {nums.map((n) => (
          <Pagination.Item key={n} active={n === page} onClick={() => onPage(n)}>{n}</Pagination.Item>
        ))}
        <Pagination.Next disabled={page === pages} onClick={() => onPage(page + 1)} />
      </Pagination>
    </div>
  );
};

export default PaginationBar;
