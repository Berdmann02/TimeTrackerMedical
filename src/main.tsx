import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import "./services/axiosConfig"; // Import axios configuration
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.tsx";
import { isSafari, logSafariCookies, checkSafariPrivacySettings, monitorSafariCookies, testSafariCrossDomainCookies } from "./utils/safariDebug";

// Safari debugging
if (isSafari()) {
  console.log('🚨 Safari detected - enabling debug mode');
  logSafariCookies();
  checkSafariPrivacySettings();
  monitorSafariCookies(); // Start monitoring cookies
  testSafariCrossDomainCookies(); // Test cross-domain cookie behavior
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
