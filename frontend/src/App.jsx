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
import EventList from "./features/events/pages/EventList";
import EventDetail from "./features/events/pages/EventDetail";
import MyTickets from "./features/tickets/pages/MyTickets";
import TicketPass from "./features/tickets/pages/TicketPass";
import DoorScanner from "./features/checkin/pages/DoorScanner";
import EventProposalStepper from "./features/events/pages/manage/EventProposalStepper";
import MentorReview from "./features/events/pages/manage/MentorReview";

function App() {
  return (
    <Routes>
      {/* Full Screen Scanner Route */}
      <Route path="/door/:eventId" element={<DoorScanner />} />

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

        {/* Phase 3: Events & Ticketing */}
        <Route path="events" element={<EventList />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="me/tickets" element={<MyTickets />} />
        <Route path="me/tickets/:id" element={<TicketPass />} />

        {/* Phase 3: Manage Events */}
        <Route path="manage/events/new" element={<EventProposalStepper />} />
        <Route path="manage/events/:id/review" element={<MentorReview />} />
      </Route>
    </Routes>
  );
}

export default App;
