// Browser Console Test Script for Safari Authentication
// Copy and paste this into your browser console in Safari

export const browserConsoleTest = () => {
  console.log('🧪 Starting Browser Console Test for Safari...');
  
  // Test 1: Check if we're in Safari
  const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  console.log(`1. Safari Detection: ${isSafari ? '✅ Yes' : '❌ No'}`);
  
  // Test 2: Check sessionStorage
  try {
    sessionStorage.setItem('test_token', 'test_value');
    const retrieved = sessionStorage.getItem('test_token');
    sessionStorage.removeItem('test_token');
    console.log(`2. SessionStorage: ${retrieved === 'test_value' ? '✅ Working' : '❌ Failed'}`);
  } catch (error) {
    console.log(`2. SessionStorage: ❌ Error - ${error}`);
  }
  
  // Test 3: Check cookies
  const cookies = document.cookie;
  console.log(`3. Cookies: ${cookies ? '✅ Present' : '❌ None'}`);
  console.log(`   Cookie content: ${cookies}`);
  
  // Test 4: Check if auth token exists
  const authToken = sessionStorage.getItem('auth_token');
  console.log(`4. Auth Token: ${authToken ? '✅ Present' : '❌ Missing'}`);
  if (authToken) {
    console.log(`   Token length: ${authToken.length}`);
  }
  
  // Test 5: Test API call
  const testAPI = async () => {
    try {
      const response = await fetch('https://time-tracker-medical-backend-production.up.railway.app/auth/test', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log(`5. API Test: ✅ Status ${response.status}`);
      const data = await response.json();
      console.log(`   Response:`, data);
    } catch (error) {
      console.log(`5. API Test: ❌ Error - ${error}`);
    }
  };
  
  testAPI();
  
  console.log('\n📋 Test Summary:');
  console.log('- If all tests pass, Safari authentication should work');
  console.log('- If API test fails, check your network connection');
  console.log('- If cookies are missing, that\'s expected with Safari privacy settings');
};

// Auto-run the test if this script is loaded
if (typeof window !== 'undefined') {
  // Wait a moment for the page to load
  setTimeout(() => {
    browserConsoleTest();
  }, 1000);
}

// Export for manual testing
export default browserConsoleTest; 