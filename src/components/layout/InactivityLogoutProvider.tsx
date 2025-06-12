import type React from 'react';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { InactivityWarningModal } from '../ui/InactivityWarningModal';
import { useAuth } from '../../contexts/AuthContext';
import { createContext, useContext, useState } from 'react';

interface InactivityContext {
  setIsModalOpen: (isOpen: boolean) => void;
}

const InactivityContext = createContext<InactivityContext | null>(null);

export const useInactivityContext = () => {
  const context = useContext(InactivityContext);
  if (!context) {
    throw new Error('useInactivityContext must be used within InactivityLogoutProvider');
  }
  return context;
};

interface InactivityLogoutProviderProps {
  children: React.ReactNode;
}

export const InactivityLogoutProvider: React.FC<InactivityLogoutProviderProps> = ({ children }) => {
  const { logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { showWarning, warningCountdown, dismissWarning } = useInactivityLogout({
    warningTimeout: 5000, // 5 seconds for testing (normally would be much longer like 15 minutes)
    logoutTimeout: 5000,  // 5 seconds after warning (normally would be 30 seconds to 1 minute)
    activityTimeoutOverride: isModalOpen ? 15000 : 0, // 15 seconds when modal is open
    enabled: true
  });

  const handleStayLoggedIn = () => {
    dismissWarning();
  };

  const handleLogoutNow = () => {
    logout();
  };

  return (
    <InactivityContext.Provider value={{ setIsModalOpen }}>
      {children}
      <InactivityWarningModal
        isOpen={showWarning}
        countdown={warningCountdown}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleLogoutNow}
      />
    </InactivityContext.Provider>
  );
};