import { Routes,Route } from "react-router-dom";
import Navbar from  "./components/Navbar";
import LoginPage from "./pages/login/LoginPage";
import PatientsPage from "./pages/patients/PatientsPage";
import ActivityPage from "./pages/activities/ActivityPage";
import PatientDetailsPage from "./pages/patient-details/PatientDetailsPage";
import ActivityDetailsPage from "./pages/patient-details/ActivityDetails";
import UsersPage from "./pages/users/UsersPage";
import EditUserPage from "./pages/users/EditUsers";

function App(){
    return (
        <>
    <Navbar />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PatientsPage />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/activity" element={<ActivityPage />} /> {/* add id to activity & for each Patient */}
      <Route path="/patientdetails/:patientId" element={<PatientDetailsPage />} /> {/* Dynamic route with patient ID parameter */}
      <Route path="/activity/:activityId" element={<ActivityDetailsPage />} /> {/* Dynamic route with activity ID parameter */}
      <Route path="/users" element={<UsersPage />} />
      <Route path="/edit-user/:userId" element={<EditUserPage />} />
    </Routes>
        </>
    )
}

export default App;