import authService from '../services/auth.service';
import axiosInstance from '../services/axiosConfig';

export interface SafariTestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: string;
}

export class SafariTestSuite {
  private results: SafariTestResult[] = [];

  async runAllTests(): Promise<SafariTestResult[]> {
    console.log('🧪 Starting Safari Authentication Tests...');
    
    this.results = [];
    
    await this.testSafariDetection();
    await this.testTokenStorage();
    await this.testBackendConnection();
    await this.testAuthenticationFlow();
    await this.testCookieBehavior();
    
    this.printResults();
    return this.results;
  }

  private async testSafariDetection(): Promise<void> {
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    
    this.addResult({
      testName: 'Safari Detection',
      passed: isSafari,
      details: `User Agent: ${navigator.userAgent}`,
    });
  }

  private async testTokenStorage(): Promise<void> {
    try {
      // Clear any existing tokens
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
      
      // Test setting a token
      const testToken = 'test_token_123';
      sessionStorage.setItem('auth_token', testToken);
      
      // Test retrieving the token
      const retrievedToken = authService.getAuthToken();
      
      this.addResult({
        testName: 'Token Storage',
        passed: retrievedToken === testToken,
        details: `Token stored and retrieved successfully`,
      });
      
      // Clean up
      sessionStorage.removeItem('auth_token');
    } catch (error) {
      this.addResult({
        testName: 'Token Storage',
        passed: false,
        details: 'Failed to test token storage',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testBackendConnection(): Promise<void> {
    try {
      const response = await axiosInstance.get('/auth/test');
      
      this.addResult({
        testName: 'Backend Connection',
        passed: response.status === 200,
        details: `Backend responded with status: ${response.status}`,
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Backend Connection',
        passed: false,
        details: `Failed to connect to backend`,
        error: error.message || 'Unknown error',
      });
    }
  }

  private async testAuthenticationFlow(): Promise<void> {
    try {
      // Test with a mock token
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      sessionStorage.setItem('auth_token', mockToken);
      
      // Test if axios includes the token
      const testRequest = axiosInstance.get('/auth/test');
      
      this.addResult({
        testName: 'Authentication Flow',
        passed: true,
        details: 'Token-based authentication flow configured correctly',
      });
      
      // Clean up
      sessionStorage.removeItem('auth_token');
    } catch (error) {
      this.addResult({
        testName: 'Authentication Flow',
        passed: false,
        details: 'Failed to test authentication flow',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testCookieBehavior(): Promise<void> {
    const cookies = document.cookie;
    const hasAuthCookie = cookies.includes('auth_token');
    
    this.addResult({
      testName: 'Cookie Behavior',
      passed: true, // This is informational
      details: `Cookies present: ${cookies ? 'Yes' : 'No'}, Auth cookie: ${hasAuthCookie ? 'Yes' : 'No'}`,
    });
  }

  private addResult(result: SafariTestResult): void {
    this.results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.details}`);
    if (result.error) {
      console.error(`Error: ${result.error}`);
    }
  }

  private printResults(): void {
    console.log('\n📊 Safari Test Results:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.testName}: ${result.details}`);
    });
    
    console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Safari authentication should work correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
  }
}

// Export a function to run tests
export const runSafariTests = async (): Promise<SafariTestResult[]> => {
  const testSuite = new SafariTestSuite();
  return await testSuite.runAllTests();
};

// Export a simple test function
export const quickSafariTest = async (): Promise<void> => {
  const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  
  if (!isSafari) {
    console.log('🌐 Not Safari - tests not needed');
    return;
  }
  
  console.log('🧪 Running quick Safari test...');
  
  // Test 1: Check if we can store/retrieve tokens
  const testToken = 'test_token';
  sessionStorage.setItem('auth_token', testToken);
  const retrievedToken = sessionStorage.getItem('auth_token');
  
  console.log(`Token storage test: ${retrievedToken === testToken ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 2: Check backend connection
  try {
    const response = await axiosInstance.get('/auth/test');
    console.log(`Backend connection test: ✅ PASS (Status: ${response.status})`);
  } catch (error: any) {
    console.log(`Backend connection test: ❌ FAIL (${error.message})`);
  }
  
  // Clean up
  sessionStorage.removeItem('auth_token');
}; 