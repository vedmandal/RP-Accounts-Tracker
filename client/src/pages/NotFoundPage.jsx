import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="text-center py-5">
    <h1 className="display-4 fw-bold">404</h1>
    <p className="text-muted">That page does not exist.</p>
    <Link to="/" className="btn btn-primary">Back to Home</Link>
  </div>
);

export default NotFoundPage;
