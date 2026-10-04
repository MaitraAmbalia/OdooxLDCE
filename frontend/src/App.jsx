import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import SponsorshipWorkspace from "./features/events/pages/manage/SponsorshipWorkspace";
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
import ProtectedRoute from "./app/guards/ProtectedRoute";
import NotFound from "./pages/NotFound";

const EventCalendar = React.lazy(() => import("./features/events/pages/EventCalendar"));

function App() {
  return (
    <Routes>
      {/* Full Screen / Focus Routes */}
      <Route
        path="/door/:eventId"
        element={
          <ProtectedRoute requireAuth anyPermission={["ticket.checkin", "event.door.assign"]} unauthorizedMessage="Door check-in requires ticket scanner authorization." fallbackPath="/events">
            <DoorScanner />
          </ProtectedRoute>
        }
      />

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
        <Route path="me" element={<ProtectedRoute requireAuth><AccountHome /></ProtectedRoute>} />
        <Route path="manage" element={<ProtectedRoute requireAuth requireLeadership unauthorizedMessage="Leadership workspace requires an executive or mentor role."><ManageHome /></ProtectedRoute>} />

        {/* Phase 2: Memberships and Payments */}
        <Route path="me/membership" element={<ProtectedRoute requireAuth><MyMembership /></ProtectedRoute>} />
        <Route path="checkout/status/:paymentId" element={<CheckoutStatus />} />

        {/* Phase 3: Events & Ticketing */}
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="me/tickets" element={<ProtectedRoute requireAuth><MyTickets /></ProtectedRoute>} />
        <Route path="me/tickets/:id" element={<ProtectedRoute requireAuth><TicketPass /></ProtectedRoute>} />

        {/* Phase 6: Shop & Orders */}
        <Route path="shop" element={<ShopCatalog />} />
        <Route path="shop/:id" element={<ProductDetail />} />
        <Route path="me/orders" element={<ProtectedRoute requireAuth><MyOrders /></ProtectedRoute>} />

        {/* Phase 7: Announcements & Notifications */}
        <Route path="announcements" element={<AnnouncementFeed />} />
        <Route path="announcements/:id" element={<AnnouncementDetail />} />
        <Route path="me/notifications" element={<ProtectedRoute requireAuth><NotificationList /></ProtectedRoute>} />

        {/* Phase 9: Selection (Public) */}
        <Route path="selection" element={<SelectionHub />} />
        <Route path="selection/posts/:postId/apply" element={<ProtectedRoute requireAuth requireMember unauthorizedMessage="Only active members can apply for a leadership position."><ApplicationForm /></ProtectedRoute>} />

        {/* Phase 3, 4, 5, 6, 7, 8 & 9: Manage */}
        <Route
          path="manage/events"
          element={
            <ProtectedRoute requireAuth anyPermission={["event.report.read", "event.propose", "event.publish"]} unauthorizedMessage="Event console requires event management authorization.">
              <EventConsole />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/events/new"
          element={
            <ProtectedRoute requireAuth anyPermission={["event.propose"]} unauthorizedMessage="Event proposals can only be submitted by Event Leads or the President.">
              <EventProposalStepper />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/events/:id/edit"
          element={
            <ProtectedRoute requireAuth anyPermission={["event.propose", "event.publish"]} unauthorizedMessage="Event editing requires event lead authorization.">
              <EventProposalStepper />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/events/:id/report"
          element={
            <ProtectedRoute requireAuth anyPermission={["event.report.read"]} unauthorizedMessage="Event reports are restricted to Event Leads and Executives.">
              <EventReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/memberships"
          element={
            <ProtectedRoute requireAuth anyPermission={["member.read.any", "membership.tier.manage", "membership.remind"]} unauthorizedMessage="Membership dues management is restricted to the Treasurer and President.">
              <MembershipDues />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/events/:id/review"
          element={
            <ProtectedRoute requireAuth anyPermission={["event.approve"]} unauthorizedMessage="Event proposal approval is restricted to the Faculty Mentor.">
              <MentorReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/sponsorship"
          element={
            <ProtectedRoute requireAuth anyPermission={["sponsorship.crm.read", "sponsorship.crm.manage"]} unauthorizedMessage="Sponsorship CRM is restricted to the Sponsorship Head and Treasurer.">
              <SponsorshipWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/meetings"
          element={
            <ProtectedRoute requireAuth requireLeadership unauthorizedMessage="Meetings portal is restricted to Executive Leadership.">
              <MeetingList />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/meetings/new"
          element={
            <ProtectedRoute requireAuth anyPermission={["meeting.manage"]} unauthorizedMessage="Meeting scheduling is restricted to the Club President.">
              <MeetingBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/meetings/:id"
          element={
            <ProtectedRoute requireAuth requireLeadership unauthorizedMessage="Meeting access is restricted to Executive Leadership.">
              <MeetingDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="volunteer"
          element={
            <ProtectedRoute requireAuth requireVolunteer unauthorizedMessage="Volunteer portal is only available to active volunteers and leadership.">
              <VolunteerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="volunteer/tasks/:id"
          element={
            <ProtectedRoute requireAuth requireVolunteer unauthorizedMessage="Volunteer access required.">
              <TaskDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="volunteer/claims/new"
          element={
            <ProtectedRoute requireAuth anyPermission={["claim.submit"]} unauthorizedMessage="Reimbursement claims can only be submitted by active volunteers or leads.">
              <SubmitClaim />
            </ProtectedRoute>
          }
        />
        <Route path="claims/new" element={<Navigate to="/volunteer/claims/new" replace />} />
        <Route path="claim/new" element={<Navigate to="/volunteer/claims/new" replace />} />
        <Route
          path="volunteer/claims/:id"
          element={
            <ProtectedRoute requireAuth>
              <ClaimDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="cash-desk"
          element={
            <ProtectedRoute requireAuth anyPermission={["cash.verify", "membership.verify", "ticket.checkin"]} unauthorizedMessage="Cash desk operations require cashier or treasurer authorization.">
              <CashDesk />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage/claims"
          element={
            <ProtectedRoute requireAuth anyPermission={["claim.review", "claim.review.treasurer", "claim.review.high"]} unauthorizedMessage="Claims review is restricted to the Treasurer and President.">
              <ClaimQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/claims/:id"
          element={
            <ProtectedRoute requireAuth anyPermission={["claim.review", "claim.review.treasurer", "claim.review.high"]} unauthorizedMessage="Claims review is restricted to the Treasurer and President.">
              <ClaimDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/cash"
          element={
            <ProtectedRoute requireAuth anyPermission={["cash.verify"]} unauthorizedMessage="Cash verification queue is restricted to the Treasurer.">
              <CashVerificationQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/finance/ledger"
          element={
            <ProtectedRoute requireAuth anyPermission={["ledger.read"]} unauthorizedMessage="General ledger is restricted to the Treasurer and Mentor.">
              <Ledger />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/budget"
          element={
            <ProtectedRoute requireAuth anyPermission={["budget.limit.manage", "budget.allocate"]} unauthorizedMessage="Budget management is restricted to the Mentor and Treasurer.">
              <Budget />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/finance/reports"
          element={
            <ProtectedRoute requireAuth anyPermission={["finance.report.read"]} unauthorizedMessage="Financial reports are restricted to the Treasurer and Mentor.">
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage/projects"
          element={
            <ProtectedRoute requireAuth anyPermission={["project.manage"]} unauthorizedMessage="Project management is restricted to the Volunteer Head and President.">
              <ProjectList />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/projects/:id"
          element={
            <ProtectedRoute requireAuth anyPermission={["project.manage"]} unauthorizedMessage="Project management is restricted to the Volunteer Head and President.">
              <ProjectKanban />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage/orders"
          element={
            <ProtectedRoute requireAuth anyPermission={["order.fulfil"]} unauthorizedMessage="Order fulfillment is restricted to the Marketing Head.">
              <FulfilmentQueue />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage/announcements/new"
          element={
            <ProtectedRoute requireAuth anyPermission={["announcement.publish"]} unauthorizedMessage="Announcements can only be published by the Marketing Head or President.">
              <AnnouncementComposer />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/newsletter"
          element={
            <ProtectedRoute requireAuth anyPermission={["newsletter.send", "newsletter.stats.read"]} unauthorizedMessage="Newsletter campaigns are restricted to the Marketing Head.">
              <NewsletterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/newsletter/campaigns/new"
          element={
            <ProtectedRoute requireAuth anyPermission={["newsletter.send", "newsletter.stats.read"]} unauthorizedMessage="Newsletter campaigns are restricted to the Marketing Head.">
              <CampaignComposer />
            </ProtectedRoute>
          }
        />

        <Route path="newsletter/confirm" element={<NewsletterConfirm />} />
        <Route path="newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />

        <Route
          path="manage/selection/cycles"
          element={
            <ProtectedRoute requireAuth anyPermission={["selection.manage"]} unauthorizedMessage="Leadership election configuration is restricted to the Faculty Mentor.">
              <CycleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/selection/:id/edit"
          element={
            <ProtectedRoute requireAuth anyPermission={["selection.manage"]} unauthorizedMessage="Leadership election configuration is restricted to the Faculty Mentor.">
              <CycleBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/selection/:id/applications"
          element={
            <ProtectedRoute requireAuth anyPermission={["selection.manage", "selection.review"]} unauthorizedMessage="Leadership application review is restricted to the Faculty Mentor.">
              <ApplicationReview />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
