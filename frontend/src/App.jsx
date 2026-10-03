import React from "react";
import { Routes, Route } from "react-router-dom";
import PublicLayout from "./app/layouts/PublicLayout";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import VerifyEmail from "./features/auth/pages/VerifyEmail";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        {/* Public Routes */}
        <Route index element={<div className="p-8"><h1 className="text-3xl text-[var(--color-dusk)]">Skyline Home</h1></div>} />
        
        {/* Auth Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>
    </Routes>
  );
}

export default App;
