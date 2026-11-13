import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useContexts';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { user, initialized } = useAuth();
  const location = useLocation();
  if (!initialized) return <Loader fullPage text="Checking session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

export default ProtectedRoute;
