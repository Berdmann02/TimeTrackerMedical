import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export const QuickAdminLogin = () => {
  const navigate = useNavigate();

  const handleQuickLogin = async () => {
    try {
      const response = await authService.login({
        email: "test@gmail.com",
        password: "123456"
      });
      
      authService.setToken(response.access_token);
      navigate('/');
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleQuickLogin}
      className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 cursor-pointer"
    >
      🚀 Quick Admin Login (Dev Only)
    </button>
  );
}; 