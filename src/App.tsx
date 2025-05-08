import { Routes,Route } from "react-router-dom";
import Navbar from "./Pages/GlobalComponents/Navbar";
import LoginPage from "./Pages/LoginPage/LoginPage";
import PatientsPage from "./Pages/PatientsPage/PatientsPage";
import ActivityPage from "./Pages/ActivityPage/ActivityPage";

function App(){
    return (
        <>

    <Navbar />
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/patient" element={<PatientsPage />} />
      <Route path="/activity" element={<ActivityPage />} /> {/* add id to activity & for each Patient */}
    </Routes>
        </>

    )

}

export default App;