import React, { useState } from 'react';

export const SafariWarning: React.FC = () => {
  const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isSafari) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Safari Browser Detected
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p className="mb-2">
              This application has been optimized for Safari's privacy features. 
              If you experience login issues, try these solutions:
            </p>
            
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Show troubleshooting steps
              </button>
            )}
            
            {isExpanded && (
              <div className="space-y-2">
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Try logging in again - the app now uses secure token storage</li>
                  <li>If issues persist: Safari → Preferences → Privacy</li>
                  <li>Turn OFF "Prevent cross-site tracking" temporarily</li>
                  <li>Turn OFF "Block all cookies" temporarily</li>
                  <li>Refresh this page after making changes</li>
                </ol>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-blue-600 hover:text-blue-800 underline text-xs"
                >
                  Hide troubleshooting steps
                </button>
              </div>
            )}
            
            <p className="mt-2 text-xs">
              The application now uses enhanced authentication that works better with Safari's privacy features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 