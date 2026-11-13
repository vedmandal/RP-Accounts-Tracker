import { Spinner } from 'react-bootstrap';

const Loader = ({ text = 'Loading...', fullPage = false }) => (
  <div className={`d-flex flex-column align-items-center justify-content-center text-muted ${fullPage ? 'vh-100' : 'py-5'}`}>
    <Spinner animation="border" variant="primary" />
    <span className="mt-2 small">{text}</span>
  </div>
);

export default Loader;
