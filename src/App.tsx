import { Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth.service';
import LoginPage from './pages/login/LoginPage';
import Navbar from './components/Navbar';
import PatientsPage from "./pages/patients/PatientsPage";
import ActivityPage from "./pages/activities/ActivityPage";
import PatientDetailsPage from "./pages/patient-details/PatientDetailsPage";
import ActivityDetailsPage from "./pages/patient-details/ActivityDetails";
import UsersPage from "./pages/users/UsersPage";
import EditUserPage from "./pages/users/EditUsers";

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
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
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
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
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-user/:userId"
        element={
          <ProtectedRoute>
            <EditUserPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;