import React, { useState } from 'react';
import authService from '../services/auth.service';
import axiosInstance from '../services/axiosConfig';
import { runSafariTests, quickSafariTest } from '../utils/safariTest';

export const SafariWarning: React.FC = () => {
  const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  if (!isSafari) return null;

  const runDebugTest = () => {
    const token = authService.getAuthToken();
    const cookies = document.cookie;
    
    setDebugInfo(`
Debug Info:
- Has Token: ${!!token}
- Token Length: ${token ? token.length : 0}
- Cookies: ${cookies}
- SessionStorage Keys: ${Object.keys(sessionStorage).join(', ')}
- LocalStorage Keys: ${Object.keys(localStorage).join(', ')}
    `);
  };

  const testBackendConnection = async () => {
    try {
      const response = await axiosInstance.get('/auth/test');
      setDebugInfo(prev => prev + `\n\nBackend Test Response:\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setDebugInfo(prev => prev + `\n\nBackend Test Error:\n${error.message}\nStatus: ${error.response?.status}`);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    setDebugInfo('🧪 Running comprehensive Safari tests...\n');
    
    try {
      const results = await runSafariTests();
      const summary = results.map(r => `${r.passed ? '✅' : '❌'} ${r.testName}: ${r.details}`).join('\n');
      setDebugInfo(prev => prev + `\n\nTest Results:\n${summary}`);
    } catch (error: any) {
      setDebugInfo(prev => prev + `\n\nTest Error: ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunningTests(true);
    setDebugInfo('🧪 Running quick Safari test...\n');
    
    try {
      await quickSafariTest();
      setDebugInfo(prev => prev + '\n✅ Quick test completed. Check console for details.');
    } catch (error: any) {
      setDebugInfo(prev => prev + `\n❌ Quick test failed: ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

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
            
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                {isExpanded ? 'Hide' : 'Show'} troubleshooting steps
              </button>
              <button
                onClick={runDebugTest}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
                disabled={isRunningTests}
              >
                Debug Auth
              </button>
              <button
                onClick={testBackendConnection}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
                disabled={isRunningTests}
              >
                Test Backend
              </button>
              <button
                onClick={runQuickTest}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
                disabled={isRunningTests}
              >
                Quick Test
              </button>
              <button
                onClick={runComprehensiveTests}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
                disabled={isRunningTests}
              >
                {isRunningTests ? 'Running...' : 'Full Test'}
              </button>
            </div>
            
            {debugInfo && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                {debugInfo}
              </div>
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