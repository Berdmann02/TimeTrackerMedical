import { Routes,Route } from "react-router-dom";
import Navbar from  "./components/Navbar";
import LoginPage from "./pages/login/LoginPage";
import PatientsPage from "./pages/patients/PatientsPage";
import ActivityPage from "./pages/activities/ActivityPage";

function App(){
    return (
        <>
    <Navbar />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PatientsPage />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/activity" element={<ActivityPage />} /> {/* add id to activity & for each Patient */}
    </Routes>
        </>
    )
}

export default App;