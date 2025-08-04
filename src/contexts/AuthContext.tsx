import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

interface User {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  primarysite: string;
  assignedsites: string[];
  created_at?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isNurse: boolean;
  isPharmacist: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Check if we have a stored token first
        const token = authService.getAuthToken();
        const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
        
        if (token) {
          console.log('Found stored token, attempting to fetch profile');
          if (isSafari) {
            console.log('Safari: Using stored token for authentication');
          }
          
          try {
            const profile = await authService.fetchProfile();
            setUser(profile);
            console.log('Successfully authenticated with stored token');
          } catch (profileError) {
            console.error('Failed to fetch profile with stored token:', profileError);
            // Clear invalid token
            sessionStorage.removeItem('auth_token');
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } else {
          console.log('No stored token found, user not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      
      // Safari-specific debugging
      const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
      if (isSafari) {
        console.log('Safari login successful - token stored in sessionStorage');
        console.log('Safari cookies after login:', document.cookie);
      }
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isNurse = user?.role === 'nurse';
  const isPharmacist = user?.role === 'pharmacist';

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isNurse,
        isPharmacist,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Add custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export AuthContext for direct usage if needed
export { AuthContext };