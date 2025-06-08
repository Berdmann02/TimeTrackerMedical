import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RestrictNurseRouteProps {
  children: React.ReactNode;
}

const RestrictNurseRoute = ({ children }: RestrictNurseRouteProps) => {
  const { isNurse } = useAuth();

  if (isNurse) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RestrictNurseRoute;
