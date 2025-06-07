import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RestrictPharmacistRouteProps {
  children: React.ReactNode;
}

const RestrictPharmacistRoute = ({ children }: RestrictPharmacistRouteProps) => {
  const { isPharmacist } = useAuth();

  if (isPharmacist) {
    // Redirect pharmacists to the patients page if they try to access restricted routes
    return <Navigate to="/patients" replace />;
  }

  return <>{children}</>;
};

export default RestrictPharmacistRoute;
