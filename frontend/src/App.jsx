import React from "react";
import { Routes, Route } from "react-router-dom";
import PublicLayout from "./app/layouts/PublicLayout";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import VerifyEmail from "./features/auth/pages/VerifyEmail";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import Join from "./features/membership/pages/Join";
import MyMembership from "./features/membership/pages/MyMembership";
import CheckoutStatus from "./features/payments/pages/CheckoutStatus";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        {/* Public Routes */}
        <Route index element={<div className="p-8"><h1 className="text-3xl font-display font-bold text-[var(--color-ink)]">Skyline Home</h1></div>} />
        <Route path="join" element={<Join />} />
        
        {/* Auth Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Phase 2: Memberships and Payments */}
        <Route path="me/membership" element={<MyMembership />} />
        <Route path="checkout/status/:paymentId" element={<CheckoutStatus />} />
      </Route>
    </Routes>
  );
}

export default App;
