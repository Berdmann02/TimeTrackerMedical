import type React from 'react';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { InactivityWarningModal } from '../ui/InactivityWarningModal';
import { useAuth } from '../../contexts/AuthContext';
import { createContext, useContext, useState } from 'react';

// Constants for timeouts (in milliseconds)
const DEFAULT_WARNING_TIMEOUT = 30 * 60 * 1000;    // 30 minutes
const ACTIVITY_WARNING_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_COUNTDOWN = 30 * 1000;               // 30 seconds

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
    warningTimeout: isModalOpen ? ACTIVITY_WARNING_TIMEOUT : DEFAULT_WARNING_TIMEOUT,
    logoutTimeout: WARNING_COUNTDOWN,
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