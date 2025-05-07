import { Routes,Route } from "react-router-dom";
import Navbar from "./Pages/GlobalComponents/Navbar";
import LoginPage from "./Pages/LoginPage/LoginPage";
import PatientsPage from "./Pages/PatientsPage/PatientsPage";

function App(){
    return (
        <>

    <Navbar />
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/patient" element={<PatientsPage />} />
      <Route path="/medical" element={<div>Medical Page</div>} />
    </Routes>
        </>

    )

}

export default App;