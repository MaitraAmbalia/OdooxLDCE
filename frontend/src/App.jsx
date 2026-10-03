import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicLayout from "./app/layouts/PublicLayout";
import NotFound from "./pages/NotFound";
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const VerifyEmail = lazy(() => import("./features/auth/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./features/auth/pages/ResetPassword"));
const Join = lazy(() => import("./features/membership/pages/Join"));
const MyMembership = lazy(() => import("./features/membership/pages/MyMembership"));
const CheckoutStatus = lazy(() => import("./features/payments/pages/CheckoutStatus"));
const EventList = lazy(() => import("./features/events/pages/EventList"));
const EventDetail = lazy(() => import("./features/events/pages/EventDetail"));
const MyTickets = lazy(() => import("./features/tickets/pages/MyTickets"));
const TicketPass = lazy(() => import("./features/tickets/pages/TicketPass"));
const DoorScanner = lazy(() => import("./features/checkin/pages/DoorScanner"));
const EventProposalStepper = lazy(() => import("./features/events/pages/manage/EventProposalStepper"));
const MentorReview = lazy(() => import("./features/events/pages/manage/MentorReview"));
const SubmitClaim = lazy(() => import("./features/claims/pages/SubmitClaim"));
const ClaimQueue = lazy(() => import("./features/claims/pages/manage/ClaimQueue"));
const ClaimDetail = lazy(() => import("./features/claims/pages/manage/ClaimDetail"));
const CashDesk = lazy(() => import("./features/cash/pages/CashDesk"));
const CashVerificationQueue = lazy(() => import("./features/cash/pages/manage/CashVerificationQueue"));
const Ledger = lazy(() => import("./features/finance/pages/manage/Ledger"));
const Budget = lazy(() => import("./features/finance/pages/manage/Budget"));
const Reports = lazy(() => import("./features/finance/pages/manage/Reports"));
const VolunteerHome = lazy(() => import("./features/volunteers/pages/VolunteerHome"));
const ProjectList = lazy(() => import("./features/projects/pages/manage/ProjectList"));
const ProjectKanban = lazy(() => import("./features/projects/pages/manage/ProjectKanban"));
const TaskDetail = lazy(() => import("./features/tasks/pages/TaskDetail"));
const ShopCatalog = lazy(() => import("./features/merch/pages/ShopCatalog"));
const ProductDetail = lazy(() => import("./features/merch/pages/ProductDetail"));
const MyOrders = lazy(() => import("./features/orders/pages/MyOrders"));
const FulfilmentQueue = lazy(() => import("./features/orders/pages/manage/FulfilmentQueue"));
const AnnouncementFeed = lazy(() => import("./features/announcements/pages/AnnouncementFeed"));
const AnnouncementDetail = lazy(() => import("./features/announcements/pages/AnnouncementDetail"));
const AnnouncementComposer = lazy(() => import("./features/announcements/pages/manage/AnnouncementComposer"));
const NotificationList = lazy(() => import("./features/notifications/pages/NotificationList"));
const NewsletterDashboard = lazy(() => import("./features/newsletter/pages/manage/NewsletterDashboard"));
const MeetingList = lazy(() => import("./features/meetings/pages/manage/MeetingList"));
const MeetingBuilder = lazy(() => import("./features/meetings/pages/manage/MeetingBuilder"));
const MeetingDetail = lazy(() => import("./features/meetings/pages/manage/MeetingDetail"));
const SelectionHub = lazy(() => import("./features/selection/pages/SelectionHub"));
const ApplicationForm = lazy(() => import("./features/selection/pages/ApplicationForm"));
const CycleBuilder = lazy(() => import("./features/selection/pages/manage/CycleBuilder"));
const ApplicationReview = lazy(() => import("./features/selection/pages/manage/ApplicationReview"));
const ManageHome = lazy(() => import("./features/dashboard/pages/ManageHome"));
const AccountHome = lazy(() => import("./features/dashboard/pages/AccountHome"));
const Home = lazy(() => import("./pages/Home"));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-32" role="status" aria-label="Loading page">
      <span className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Full Screen / Focus Routes */}
      <Route path="/door/:eventId" element={<DoorScanner />} />
      <Route path="/cash-desk" element={<CashDesk />} />

      <Route path="/" element={<PublicLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
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
        <Route path="events" element={<EventList />} />
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
        <Route path="manage/events/new" element={<EventProposalStepper />} />
        <Route path="manage/events/:id/review" element={<MentorReview />} />

        <Route path="volunteer" element={<VolunteerHome />} />
        <Route path="volunteer/tasks/:id" element={<TaskDetail />} />
        <Route path="volunteer/claims/new" element={<SubmitClaim />} />
        <Route path="volunteer/claims/:id" element={<ClaimDetail />} />

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

        <Route path="manage/meetings" element={<MeetingList />} />
        <Route path="manage/meetings/new" element={<MeetingBuilder />} />
        <Route path="manage/meetings/:id" element={<MeetingDetail />} />

        <Route path="manage/selection/:id/edit" element={<CycleBuilder />} />
        <Route path="manage/selection/:id/applications" element={<ApplicationReview />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default App;
