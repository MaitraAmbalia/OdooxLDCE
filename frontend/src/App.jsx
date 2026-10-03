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
import SubmitClaim from "./features/claims/pages/SubmitClaim";
import ClaimQueue from "./features/claims/pages/manage/ClaimQueue";
import ClaimDetail from "./features/claims/pages/manage/ClaimDetail";
import CashDesk from "./features/cash/pages/CashDesk";
import CashVerificationQueue from "./features/cash/pages/manage/CashVerificationQueue";
import Ledger from "./features/finance/pages/manage/Ledger";
import Budget from "./features/finance/pages/manage/Budget";
import Reports from "./features/finance/pages/manage/Reports";
import VolunteerHome from "./features/volunteers/pages/VolunteerHome";
import ProjectList from "./features/projects/pages/manage/ProjectList";
import ProjectKanban from "./features/projects/pages/manage/ProjectKanban";
import TaskDetail from "./features/tasks/pages/TaskDetail";
import ShopCatalog from "./features/merch/pages/ShopCatalog";
import ProductDetail from "./features/merch/pages/ProductDetail";
import MyOrders from "./features/orders/pages/MyOrders";
import FulfilmentQueue from "./features/orders/pages/manage/FulfilmentQueue";
import NotificationList from "./features/notifications/pages/NotificationList";
import ManageHome from "./features/dashboard/pages/ManageHome";
import AccountHome from "./features/dashboard/pages/AccountHome";

function App() {
  return (
    <Routes>
      {/* Full Screen / Focus Routes */}
      <Route path="/door/:eventId" element={<DoorScanner />} />
      <Route path="/cash-desk" element={<CashDesk />} />

      <Route path="/" element={<PublicLayout />}>
        {/* Public & Navigation Routes */}
        <Route index element={<AccountHome />} />
        <Route path="me" element={<AccountHome />} />
        <Route path="manage" element={<ManageHome />} />
        <Route path="join" element={<Join />} />

        {/* Auth Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Memberships & Payments */}
        <Route path="me/membership" element={<MyMembership />} />
        <Route path="checkout/status/:paymentId" element={<CheckoutStatus />} />

        {/* Events & Ticketing */}
        <Route path="events" element={<EventList />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="me/tickets" element={<MyTickets />} />
        <Route path="me/tickets/:id" element={<TicketPass />} />
        <Route path="manage/events/new" element={<EventProposalStepper />} />
        <Route path="manage/events/:id/review" element={<MentorReview />} />

        {/* Merch Store & Orders */}
        <Route path="shop" element={<ShopCatalog />} />
        <Route path="shop/:id" element={<ProductDetail />} />
        <Route path="me/orders" element={<MyOrders />} />
        <Route path="manage/orders" element={<FulfilmentQueue />} />

        {/* Volunteers & Projects */}
        <Route path="volunteer" element={<VolunteerHome />} />
        <Route path="volunteer/tasks/:id" element={<TaskDetail />} />
        <Route path="manage/projects" element={<ProjectList />} />
        <Route path="manage/projects/:id" element={<ProjectKanban />} />

        {/* Finance, Claims & Cash Desk */}
        <Route path="volunteer/claims/new" element={<SubmitClaim />} />
        <Route path="volunteer/claims/:id" element={<ClaimDetail />} />
        <Route path="manage/claims" element={<ClaimQueue />} />
        <Route path="manage/claims/:id" element={<ClaimDetail />} />
        <Route path="manage/cash" element={<CashVerificationQueue />} />
        <Route path="manage/finance/ledger" element={<Ledger />} />
        <Route path="manage/budget" element={<Budget />} />
        <Route path="manage/finance/reports" element={<Reports />} />

        {/* Notifications */}
        <Route path="me/notifications" element={<NotificationList />} />
      </Route>
    </Routes>
  );
}

export default App;
