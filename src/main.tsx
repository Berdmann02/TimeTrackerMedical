import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import LoginPage from './Pages/LoginPage/LoginPage.tsx'
import PatientsPage from './Pages/PatientsPage/PatientsPage.tsx'


createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage/>} />
            <Route path = '/patient' element = {<PatientsPage/>}/>
          </Routes>
        </BrowserRouter>
      </React.StrictMode>,
)
