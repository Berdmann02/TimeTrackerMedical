import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseInactivityLogoutOptions {
  warningTimeout?: number; // Time in ms before showing warning
  logoutTimeout?: number;  // Time in ms before auto logout
  enabled?: boolean;       // Whether the feature is enabled
}

export const useInactivityLogout = (options: UseInactivityLogoutOptions = {}) => {
  const {
    warningTimeout = 5000, // 5 seconds for testing
    logoutTimeout = 5000,  // Additional 5 seconds after warning
    enabled = true
  } = options;

  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(0);
  
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    console.log('🧹 Clearing all timers');
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Start the inactivity timers
  const startTimers = useCallback(() => {
    console.log('⏰ Starting inactivity timers');
    console.log(`   Warning in ${warningTimeout}ms, logout in ${warningTimeout + logoutTimeout}ms`);
    
    // Clear any existing timers first
    clearTimers();
    
    // Hide warning if it was showing
    setShowWarning(false);
    setWarningCountdown(0);

    // Start warning timer
    warningTimerRef.current = window.setTimeout(() => {
      console.log('⚠️ Warning triggered - showing modal');
      setShowWarning(true);
      setWarningCountdown(Math.ceil(logoutTimeout / 1000));
      
      // Start countdown timer
      countdownTimerRef.current = window.setInterval(() => {
        setWarningCountdown((prev) => {
          const newCount = prev - 1;
          console.log(`⏳ Countdown: ${newCount}`);
          if (newCount <= 0) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return 0;
          }
          return newCount;
        });
      }, 1000);

      // Start logout timer
      logoutTimerRef.current = window.setTimeout(() => {
        console.log('🚪 Auto logout triggered');
        logout();
        setShowWarning(false);
        setWarningCountdown(0);
      }, logoutTimeout);
    }, warningTimeout);
  }, [warningTimeout, logoutTimeout, logout, clearTimers]);

  // Handle user activity - simplified without circular dependencies
  const handleActivity = useCallback(() => {
    if (!enabled || !isAuthenticated) {
      console.log('❌ Activity ignored - disabled or not authenticated');
      return;
    }

    console.log('👆 User activity detected - resetting timers');
    startTimers();
  }, [enabled, isAuthenticated, startTimers]);

  // Dismiss warning and reset timers
  const dismissWarning = useCallback(() => {
    console.log('✅ Warning dismissed by user');
    setShowWarning(false);
    setWarningCountdown(0);
    clearTimers();
    startTimers(); // Start fresh timers
  }, [clearTimers, startTimers]);

  // Set up event listeners for user activity
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      console.log('🔒 Inactivity logout disabled or user not authenticated');
      clearTimers();
      setShowWarning(false);
      return;
    }

    console.log('🎯 Setting up inactivity tracking');

    const events = [
      'mousedown',
      'mousemove', 
      'keydown',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Use a throttled version to avoid too many calls
    let throttleTimer: number | null = null;
    const throttledHandleActivity = () => {
      if (throttleTimer) return;
      
      handleActivity();
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
      }, 1000); // Throttle to once per second
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledHandleActivity, { 
        passive: true, 
        capture: true 
      });
    });

    // Initialize activity tracking
    handleActivity();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up inactivity tracking');
      events.forEach(event => {
        document.removeEventListener(event, throttledHandleActivity, { 
          capture: true 
        } as any);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      clearTimers();
    };
  }, [enabled, isAuthenticated, handleActivity, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    showWarning,
    warningCountdown,
    dismissWarning
  };
}; 