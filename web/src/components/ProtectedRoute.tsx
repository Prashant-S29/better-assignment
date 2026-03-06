import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
