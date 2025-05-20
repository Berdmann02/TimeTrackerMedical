import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '../services/auth.service';

export const QuickAdminLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First clear any existing auth state
      authService.logout();
      
      const response = await authService.login({
        email: "test@gmail.com",
        password: "123123"
      });
      
      // Set the new token
      authService.setToken(response.access_token);
      
      // Force a small delay to ensure token is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Quick login failed:', error);
      setError(error.response?.data?.message || 'Quick login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleQuickLogin}
        disabled={isLoading}
        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 cursor-pointer appearance-none bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '🔄 Signing in...' : '🚀 Quick Admin Login (Dev Only)'}
      </button>
    </div>
  );
}; 