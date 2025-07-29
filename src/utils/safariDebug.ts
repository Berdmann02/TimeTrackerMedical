// Safari-specific debugging utilities

export const isSafari = (): boolean => {
  return navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
};

export const logSafariCookies = (): void => {
  if (isSafari()) {
    console.log('Safari cookie debug:', {
      allCookies: document.cookie,
      hasAuthToken: document.cookie.includes('auth_token'),
      cookieLength: document.cookie.length
    });
  }
};

export const testSafariCookieAccess = (): void => {
  if (isSafari()) {
    console.log('Testing Safari cookie access...');
    
    // Test if we can read cookies
    console.log('Document cookies:', document.cookie);
    
    // Test if we can set a test cookie
    try {
      document.cookie = 'safari_test=test_value; path=/; max-age=60';
      console.log('Test cookie set successfully');
      
      // Check if the test cookie was set
      setTimeout(() => {
        console.log('Test cookie after setting:', document.cookie.includes('safari_test'));
      }, 100);
    } catch (error) {
      console.error('Failed to set test cookie:', error);
    }
  }
};

export const monitorSafariCookies = (): void => {
  if (isSafari()) {
    console.log('🔍 Monitoring Safari cookies...');
    
    // Monitor cookies every 2 seconds
    const interval = setInterval(() => {
      const cookies = document.cookie;
      const hasAuthToken = cookies.includes('auth_token');
      
      console.log('Safari cookie check:', {
        timestamp: new Date().toISOString(),
        hasAuthToken,
        cookieCount: cookies.split(';').length,
        allCookies: cookies
      });
      
      if (!hasAuthToken) {
        console.warn('⚠️ auth_token cookie missing in Safari!');
      }
    }, 2000);
    
    // Stop monitoring after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log('🛑 Stopped Safari cookie monitoring');
    }, 30000);
  }
};

export const checkSafariPrivacySettings = (): void => {
  if (isSafari()) {
    console.log('Safari privacy check - please verify:');
    console.log('1. Safari → Preferences → Privacy → "Prevent cross-site tracking" is OFF');
    console.log('2. Safari → Preferences → Privacy → "Block all cookies" is OFF');
    console.log('3. Safari → Preferences → Privacy → "Block pop-up windows" is OFF');
  }
};

export const testSafariCrossDomainCookies = (): void => {
  if (isSafari()) {
    console.log('🧪 Testing Safari cross-domain cookie behavior...');
    
    // Test if we can make a request to the backend and see if cookies are sent
    fetch('https://time-tracker-medical-backend-production.up.railway.app/auth/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      console.log('Safari cross-domain test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    })
    .catch(error => {
      console.error('Safari cross-domain test error:', error);
    });
  }
}; 