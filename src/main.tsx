import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, } from "react-router-dom";
import "./services/axiosConfig"; // Import axios configuration

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
