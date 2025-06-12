import type React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  countdown,
  onStayLoggedIn,
  onLogoutNow
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />
        
        {/* Modal panel */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Session Timeout Warning
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    You've been inactive for a while. For your security, we'll log you out automatically.
                  </p>
                  
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-bold text-red-600">
                      {countdown} second{countdown !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Click "Stay Logged In" to continue your session, or "Logout Now" to sign out immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto transition-colors duration-200"
              onClick={onStayLoggedIn}
            >
              Stay Logged In
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto transition-colors duration-200"
              onClick={onLogoutNow}
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 