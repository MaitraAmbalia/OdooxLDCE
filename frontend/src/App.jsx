import React from "react";
import { Routes, Route } from "react-router-dom";
import DiscoveryLayout from "./app/layouts/DiscoveryLayout";
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
import AnnouncementFeed from "./features/announcements/pages/AnnouncementFeed";
import AnnouncementDetail from "./features/announcements/pages/AnnouncementDetail";
import AnnouncementComposer from "./features/announcements/pages/manage/AnnouncementComposer";
import NotificationList from "./features/notifications/pages/NotificationList";
import NewsletterDashboard from "./features/newsletter/pages/manage/NewsletterDashboard";
import CampaignComposer from "./features/newsletter/pages/manage/CampaignComposer";
import NewsletterConfirm from "./features/newsletter/pages/NewsletterConfirm";
import NewsletterUnsubscribe from "./features/newsletter/pages/NewsletterUnsubscribe";
import MeetingList from "./features/meetings/pages/manage/MeetingList";
import MeetingBuilder from "./features/meetings/pages/manage/MeetingBuilder";
import MeetingDetail from "./features/meetings/pages/manage/MeetingDetail";
import SelectionHub from "./features/selection/pages/SelectionHub";
import ApplicationForm from "./features/selection/pages/ApplicationForm";
import CycleBuilder from "./features/selection/pages/manage/CycleBuilder";
import CycleList from "./features/selection/pages/manage/CycleList";
import ApplicationReview from "./features/selection/pages/manage/ApplicationReview";
import ManageHome from "./features/dashboard/pages/ManageHome";
import EventConsole from "./features/events/pages/manage/EventConsole";
import EventReport from "./features/events/pages/manage/EventReport";
import MembershipDues from "./features/membership/pages/manage/MembershipDues";
import AccountHome from "./features/dashboard/pages/AccountHome";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const EventCalendar = React.lazy(() => import("./features/events/pages/EventCalendar"));

function App() {
  return (
    <Routes>
      {/* Full Screen / Focus Routes */}
      <Route path="/door/:eventId" element={<DoorScanner />} />

      <Route element={<DiscoveryLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/calendar" element={<React.Suspense fallback={<div className="page-container py-16 text-sm text-muted-foreground">Opening the calendar…</div>}><EventCalendar /></React.Suspense>} />
        {/* Public Routes */}
        <Route path="join" element={<Join />} />

        {/* Auth Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Phase 10: Dashboards */}
        <Route path="me" element={<AccountHome />} />
        <Route path="manage" element={<ManageHome />} />

        {/* Phase 2: Memberships and Payments */}
        <Route path="me/membership" element={<MyMembership />} />
        <Route path="checkout/status/:paymentId" element={<CheckoutStatus />} />

        {/* Phase 3: Events & Ticketing */}
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="me/tickets" element={<MyTickets />} />
        <Route path="me/tickets/:id" element={<TicketPass />} />

        {/* Phase 6: Shop & Orders */}
        <Route path="shop" element={<ShopCatalog />} />
        <Route path="shop/:id" element={<ProductDetail />} />
        <Route path="me/orders" element={<MyOrders />} />

        {/* Phase 7: Announcements & Notifications */}
        <Route path="announcements" element={<AnnouncementFeed />} />
        <Route path="announcements/:id" element={<AnnouncementDetail />} />
        <Route path="me/notifications" element={<NotificationList />} />

        {/* Phase 9: Selection (Public) */}
        <Route path="selection" element={<SelectionHub />} />
        <Route path="selection/posts/:postId/apply" element={<ApplicationForm />} />

        {/* Phase 3, 4, 5, 6, 7, 8 & 9: Manage */}
        <Route path="manage/events" element={<EventConsole />} />
        <Route path="manage/events/new" element={<EventProposalStepper />} />
        <Route path="manage/events/:id/edit" element={<EventProposalStepper />} />
        <Route path="manage/events/:id/report" element={<EventReport />} />
        <Route path="manage/memberships" element={<MembershipDues />} />
        <Route path="manage/events/:id/review" element={<MentorReview />} />

        <Route path="volunteer" element={<VolunteerHome />} />
        <Route path="volunteer/tasks/:id" element={<TaskDetail />} />
        <Route path="volunteer/claims/new" element={<SubmitClaim />} />
        <Route path="volunteer/claims/:id" element={<ClaimDetail />} />
        <Route path="cash-desk" element={<CashDesk />} />

        <Route path="manage/claims" element={<ClaimQueue />} />
        <Route path="manage/claims/:id" element={<ClaimDetail />} />
        <Route path="manage/cash" element={<CashVerificationQueue />} />
        <Route path="manage/finance/ledger" element={<Ledger />} />
        <Route path="manage/budget" element={<Budget />} />
        <Route path="manage/finance/reports" element={<Reports />} />

        <Route path="manage/projects" element={<ProjectList />} />
        <Route path="manage/projects/:id" element={<ProjectKanban />} />

        <Route path="manage/orders" element={<FulfilmentQueue />} />

        <Route path="manage/announcements/new" element={<AnnouncementComposer />} />
        <Route path="manage/newsletter" element={<NewsletterDashboard />} />
        <Route path="manage/newsletter/campaigns/new" element={<CampaignComposer />} />

        <Route path="newsletter/confirm" element={<NewsletterConfirm />} />
        <Route path="newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />

        <Route path="manage/meetings" element={<MeetingList />} />
        <Route path="manage/meetings/new" element={<MeetingBuilder />} />
        <Route path="manage/meetings/:id" element={<MeetingDetail />} />

        <Route path="manage/selection/cycles" element={<CycleList />} />
        <Route path="manage/selection/:id/edit" element={<CycleBuilder />} />
        <Route path="manage/selection/:id/applications" element={<ApplicationReview />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
