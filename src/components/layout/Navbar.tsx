import { useState, useEffect, useRef } from "react"
import { Menu, X, Users, LogOut, Building2, Activity, FileText, UserCheck, User, ChevronDown } from "lucide-react"
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, isNurse, isPharmacist, user } = useAuth();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  // Helper function to determine if a path is active
  const isActivePath = (path: string) => {
    if (path === '/patients' || path === '/') {
      return location.pathname === '/' || location.pathname === '/patients' || location.pathname.startsWith('/patientdetails');
    }
    if (path === '/reports') {
      return location.pathname === '/reports' || location.pathname === '/site-reports' || location.pathname === '/patient-reports';
    }
    return location.pathname.startsWith(path);
  };

  // Helper function to get link classes
  const getLinkClasses = (path: string, isMobile = false) => {
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
      : "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2";
    
    const activeClasses = "text-blue-600";
    const inactiveClasses = "text-gray-700 hover:text-blue-600";
    
    return `${baseClasses} ${isActivePath(path) ? activeClasses : inactiveClasses}`;
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
            <img src="/logoNavbar.png" alt="MediTrack Time Logo" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/patients"
              className={getLinkClasses('/patients')}
            >
              <UserCheck className="w-5 h-5" />
              Patients
            </Link>
            {!isPharmacist && !isNurse && (
              <Link
                to="/sites"
                className={getLinkClasses('/sites')}
              >
                <Building2 className="w-5 h-5" />
                Sites
              </Link>
            )}
            <Link
              to="/medical-activities"
              className={getLinkClasses('/medical-activities')}
            >
              <Activity className="w-5 h-5" />
              Medical Activities
            </Link>
            {!isPharmacist && !isNurse && (
              <Link
                to="/reports"
                className={getLinkClasses('/reports')}
              >
                <FileText className="w-5 h-5" />
                Reports
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/users"
                className={getLinkClasses('/users')}
              >
                <Users className="w-5 h-5" />
                Manage Users
              </Link>
            )}
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleProfile}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          Administrator
                        </span>
                      )}
                      {isNurse && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                          Nurse
                        </span>
                      )}
                      {isPharmacist && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                          Pharmacist
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/patients"
              className={getLinkClasses('/patients', true)}
              onClick={toggleMenu}
            >
              <UserCheck className="w-5 h-5" />
              Patients
            </Link>
            {!isPharmacist && !isNurse && (
              <Link
                to="/sites"
                className={getLinkClasses('/sites', true)}
                onClick={toggleMenu}
              >
                <Building2 className="w-5 h-5" />
                Sites
              </Link>
            )}
            <Link
              to="/medical-activities"
              className={getLinkClasses('/medical-activities', true)}
              onClick={toggleMenu}
            >
              <Activity className="w-5 h-5" />
              Medical Activities
            </Link>
            {!isPharmacist && !isNurse && (
              <Link
                to="/reports"
                className={getLinkClasses('/reports', true)}
                onClick={toggleMenu}
              >
                <FileText className="w-5 h-5" />
                Reports
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/users"
                className={getLinkClasses('/users', true)}
                onClick={toggleMenu}
              >
                <Users className="w-5 h-5" />
                Manage Users
              </Link>
            )}
            
            {/* Mobile User Profile Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="px-3 py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        Administrator
                      </span>
                    )}
                    {isNurse && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Nurse
                      </span>
                    )}
                    {isPharmacist && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        Pharmacist
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  toggleMenu();
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar