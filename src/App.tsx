import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/login/LoginPage';
import PatientsPage from "./pages/patients/PatientsPage";
import ActivityPage from "./pages/activities/ActivityPage";
import PatientDetailsPage from "./pages/patient-details/PatientDetailsPage";
import ActivityDetailsPage from "./pages/patient-details/ActivityDetails";
import UsersPage from "./pages/users/UsersPage";
import SitesPage from "./pages/sites/SitesPage";
import MedicalActivitiesPage from "./pages/medical-activities/MedicalActivitiesPage";
import { LoadingScreen } from './components/ui/LoadingScreen';
import ReportsPage from './pages/reports/ReportsPage';
import SiteReportsPage from './pages/reports/SiteReportsPage';
import SiteDetailsPage from './pages/sites/SiteDetailsPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import { PublicRoute } from './components/layout/PublicRoute';
import RestrictPharmacistRoute from './components/layout/RestrictPharmacistRoute';

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
            <RestrictPharmacistRoute>
              <SitesPage />
            </RestrictPharmacistRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites/:siteId"
        element={
          <ProtectedRoute>
            <RestrictPharmacistRoute>
              <SiteDetailsPage />
            </RestrictPharmacistRoute>
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
            <RestrictPharmacistRoute>
              <ReportsPage />
            </RestrictPharmacistRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/site-reports"
        element={
          <ProtectedRoute>
            <RestrictPharmacistRoute>
              <SiteReportsPage />
            </RestrictPharmacistRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;