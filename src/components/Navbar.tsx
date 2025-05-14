import { useState } from "react"
import { Menu, X, Users, LogOut, Building2, Activity } from "lucide-react"
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">MediTrackTime</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/sites"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Sites
            </Link>
            <Link
              to="/medical-activities"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              Medical Activities
            </Link>
            <Link
              to="/users"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Manage Users
            </Link>
            <button
              onClick={handleLogout}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/sites"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={toggleMenu}
            >
              <Building2 className="w-5 h-5" />
              Sites
            </Link>
            <Link
              to="/medical-activities"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={toggleMenu}
            >
              <Activity className="w-5 h-5" />
              Medical Activities
            </Link>
            <Link
              to="/users"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={toggleMenu}
            >
              <Users className="w-5 h-5" />
              Manage Users
            </Link>
            <button
              onClick={() => {
                toggleMenu();
                handleLogout();
              }}
              className="w-full text-left bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
