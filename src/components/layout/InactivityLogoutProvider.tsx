import type React from 'react';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { InactivityWarningModal } from '../ui/InactivityWarningModal';
import { useAuth } from '../../contexts/AuthContext';

interface InactivityLogoutProviderProps {
  children: React.ReactNode;
}

export const InactivityLogoutProvider: React.FC<InactivityLogoutProviderProps> = ({ children }) => {
  const { logout } = useAuth();
  
  const { showWarning, warningCountdown, dismissWarning } = useInactivityLogout({
    warningTimeout: 5000, // 5 seconds for testing (normally would be much longer like 15 minutes)
    logoutTimeout: 5000,  // 5 seconds after warning (normally would be 30 seconds to 1 minute)  
    enabled: true
  });

  const handleStayLoggedIn = () => {
    dismissWarning();
  };

  const handleLogoutNow = () => {
    logout();
  };

  return (
    <>
      {children}
      <InactivityWarningModal
        isOpen={showWarning}
        countdown={warningCountdown}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleLogoutNow}
      />
    </>
  );
}; 