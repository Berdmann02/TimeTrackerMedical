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
        allCookies: cookies,
        url: window.location.href,
        domain: window.location.hostname
      });
      
      if (!hasAuthToken) {
        console.warn('⚠️ auth_token cookie missing in Safari!');
        
        // Test if we can set a cookie manually
        try {
          document.cookie = 'safari_test_cookie=test; path=/; max-age=60';
          console.log('Test cookie set, checking if it persists...');
        } catch (error) {
          console.error('Failed to set test cookie:', error);
        }
      } else {
        console.log('✅ auth_token cookie found in Safari');
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

export const testSafariCookieSending = (): void => {
  if (isSafari()) {
    console.log('🧪 Testing if Safari sends cookies with requests...');
    
    // Create a test request and log all details
    const testRequest = new XMLHttpRequest();
    testRequest.open('GET', 'https://time-tracker-medical-backend-production.up.railway.app/auth/profile', true);
    testRequest.withCredentials = true;
    testRequest.setRequestHeader('Content-Type', 'application/json');
    
    testRequest.onreadystatechange = function() {
      if (testRequest.readyState === 4) {
        console.log('Safari XHR test result:', {
          status: testRequest.status,
          statusText: testRequest.statusText,
          responseText: testRequest.responseText,
          getAllResponseHeaders: testRequest.getAllResponseHeaders()
        });
      }
    };
    
    testRequest.send();
  }
};

export const testSafariThirdPartyCookies = (): void => {
  if (isSafari()) {
    console.log('🧪 Testing Safari third-party cookie behavior...');
    
    // Check if Safari is blocking third-party cookies
    const currentDomain = window.location.hostname;
    const backendDomain = 'time-tracker-medical-backend-production.up.railway.app';
    
    console.log('Domain comparison:', {
      currentDomain,
      backendDomain,
      isCrossDomain: currentDomain !== backendDomain
    });
    
    // Test setting a cookie for the backend domain
    try {
      // This should fail in Safari if third-party cookies are blocked
      document.cookie = `safari_third_party_test=test; domain=${backendDomain}; path=/; max-age=60`;
      console.log('Third-party cookie test set');
    } catch (error) {
      console.error('Third-party cookie test failed:', error);
    }
    
    // Check Safari's Intelligent Tracking Prevention
    console.log('Safari ITP check - this might be blocking cross-domain cookies');
    console.log('To disable ITP: Safari → Preferences → Privacy → "Prevent cross-site tracking" → OFF');
  }
}; 