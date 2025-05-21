import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/login/LoginPage';
import Navbar from './components/Navbar';
import PatientsPage from "./pages/patients/PatientsPage";
import ActivityPage from "./pages/activities/ActivityPage";
import PatientDetailsPage from "./pages/patient-details/PatientDetailsPage";
import ActivityDetailsPage from "./pages/patient-details/ActivityDetails";
import UsersPage from "./pages/users/UsersPage";
import SitesPage from "./pages/sites/SitesPage";
import MedicalActivitiesPage from "./pages/medical-activities/MedicalActivitiesPage";
import { LoadingScreen } from './components/LoadingScreen';
import ReportsPage from './pages/reports/ReportsPage';
import SiteDetailsPage from './pages/sites/SiteDetailsPage';
// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Admin Route wrapper component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Public Route wrapper component (for login)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <ActivityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patientdetails/:patientId"
        element={
          <ProtectedRoute>
            <PatientDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity/:activityId"
        element={
          <ProtectedRoute>
            <ActivityDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/sites"
        element={
          <ProtectedRoute>
            <SitesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites/:siteId"
        element={
          <ProtectedRoute>
            <SiteDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-activities"
        element={
          <ProtectedRoute>
            <MedicalActivitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;