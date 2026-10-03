-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "EmailTokenPurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "RefreshTokenRevokeReason" AS ENUM ('ROTATED', 'LOGOUT', 'REUSE_DETECTED', 'PASSWORD_RESET', 'ADMIN_REVOKED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MEMBER', 'VOLUNTEER', 'TASK_ASSIGNEE', 'DOOR_VOLUNTEER', 'CASH_DESK', 'VOLUNTEER_HEAD', 'EVENT_HEAD', 'MARKETING_HEAD', 'TREASURER', 'PRESIDENT', 'MENTOR');

-- CreateEnum
CREATE TYPE "LeadershipRole" AS ENUM ('VOLUNTEER_HEAD', 'EVENT_HEAD', 'MARKETING_HEAD', 'TREASURER', 'PRESIDENT');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('EVENT', 'TASK', 'MEMBERSHIP_DRIVE');

-- CreateEnum
CREATE TYPE "RoleAssignmentSource" AS ENUM ('SELECTION', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MembershipDurationType" AS ENUM ('ACADEMIC_YEAR', 'SEMESTER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'LAPSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MembershipSource" AS ENUM ('ONLINE', 'CASH');

-- CreateEnum
CREATE TYPE "CashCollectionPurpose" AS ENUM ('MEMBERSHIP', 'TICKET', 'FUNDRAISER', 'MERCH');

-- CreateEnum
CREATE TYPE "CashCollectionStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventReviewDecision" AS ENUM ('APPROVE', 'REQUEST_CHANGES', 'REJECT');

-- CreateEnum
CREATE TYPE "TicketAudience" AS ENUM ('MEMBER', 'NON_MEMBER', 'ALL');

-- CreateEnum
CREATE TYPE "TicketReservationStatus" AS ENUM ('HELD', 'CONVERTED', 'RELEASED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ISSUED', 'CHECKED_IN', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "LedgerCategory" AS ENUM ('DUES', 'TICKETS', 'MERCH', 'FUNDRAISER', 'BUDGET_ALLOCATION', 'SPONSORSHIP', 'REIMBURSEMENT', 'PURCHASE', 'REFUND', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerSourceType" AS ENUM ('PAYMENT', 'CASH_COLLECTION', 'CLAIM', 'ALLOCATION', 'MANUAL', 'REVERSAL', 'REFUND');

-- CreateEnum
CREATE TYPE "BudgetAllocationSource" AS ENUM ('UNIVERSITY_GRANT', 'CARRY_FORWARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseClaimStatus" AS ENUM ('SUBMITTED', 'APPROVED_L1', 'APPROVED', 'REJECTED', 'PAID', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ExpenseClaimRoute" AS ENUM ('STANDARD', 'HIGH_VALUE', 'TREASURER_SELF');

-- CreateEnum
CREATE TYPE "ClaimDecisionLevel" AS ENUM ('L1', 'L2');

-- CreateEnum
CREATE TYPE "ClaimDecisionValue" AS ENUM ('APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "SelectionCycleStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'UNDER_REVIEW', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SelectionQuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'SINGLE_CHOICE', 'MULTI_CHOICE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'APPOINTED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('MEMBERSHIP', 'TICKET', 'MERCH_ORDER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'MOCK');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('RECEIPT', 'MERCH_IMAGE', 'EVENT_COVER', 'AVATAR', 'APPLICATION_ATTACHMENT', 'LEDGER_ATTACHMENT');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('MERCH_PRICE', 'TIER_PRICE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_PRICE_APPROVAL', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'READY', 'COLLECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('PUBLIC', 'MEMBERS', 'EVENT_ATTENDEES', 'LEADERS', 'VOLUNTEERS');

-- CreateEnum
CREATE TYPE "AnnouncementChannel" AS ENUM ('WEB', 'EMAIL');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('PENDING_CONFIRMATION', 'SUBSCRIBED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "NewsletterConsentAction" AS ENUM ('OPT_IN', 'CONFIRM', 'OPT_OUT');

-- CreateEnum
CREATE TYPE "NewsletterConsentSource" AS ENUM ('SIGNUP_FORM', 'PROFILE', 'EMAIL_LINK');

-- CreateEnum
CREATE TYPE "NewsletterCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('FUNDRAISER', 'EVENT_PREP', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "MeetingAudience" AS ENUM ('LEADERS', 'VOLUNTEERS', 'BOTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MeetingRsvp" AS ENUM ('PENDING', 'YES', 'NO', 'MAYBE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_file_id" UUID,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "parent_token_id" UUID,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoke_reason" "RefreshTokenRevokeReason",
    "user_agent" TEXT,
    "ip" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "EmailTokenPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "scope_type" "ScopeType",
    "scope_id" UUID,
    "term_start" TIMESTAMPTZ(6) NOT NULL,
    "term_end" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "source" "RoleAssignmentSource" NOT NULL,
    "created_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_tiers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_paise" BIGINT NOT NULL,
    "duration_type" "MembershipDurationType" NOT NULL,
    "benefits" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "source" "MembershipSource" NOT NULL,
    "payment_id" UUID,
    "cash_collection_id" UUID,
    "card_secret_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_collections" (
    "id" UUID NOT NULL,
    "collected_by" UUID NOT NULL,
    "purpose" "CashCollectionPurpose" NOT NULL,
    "ref_id" UUID NOT NULL,
    "payer_user_id" UUID,
    "amount_paise" BIGINT NOT NULL,
    "status" "CashCollectionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "reject_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cash_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seats_sold" INTEGER NOT NULL DEFAULT 0,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "volunteers_needed" INTEGER NOT NULL DEFAULT 0,
    "logistics_notes" TEXT,
    "cover_file_id" UUID,
    "approved_budget_paise" BIGINT,
    "proposed_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_budget_lines" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reviews" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "decision" "EventReviewDecision" NOT NULL,
    "comment" TEXT,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "audience" "TicketAudience" NOT NULL,
    "price_paise" BIGINT NOT NULL,
    "quota" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "max_per_user" INTEGER NOT NULL,
    "sales_start_at" TIMESTAMPTZ(6) NOT NULL,
    "sales_end_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_reservations" (
    "id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "payment_id" UUID,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "TicketReservationStatus" NOT NULL DEFAULT 'HELD',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "price_paid_paise" BIGINT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ISSUED',
    "checked_in_at" TIMESTAMPTZ(6),
    "checked_in_by" UUID,
    "payment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "source_type" "LedgerSourceType" NOT NULL,
    "source_id" UUID NOT NULL,
    "event_id" UUID,
    "project_id" UUID,
    "description" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "recorded_by" UUID,
    "reverses_entry_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "source" "BudgetAllocationSource" NOT NULL,
    "note" TEXT,
    "allocated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_limits" (
    "id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "limit_paise" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "budget_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claims" (
    "id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "spent_at" TIMESTAMPTZ(6) NOT NULL,
    "event_id" UUID,
    "project_id" UUID,
    "task_id" UUID,
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "route" "ExpenseClaimRoute" NOT NULL,
    "paid_method" TEXT,
    "paid_reference" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_receipts" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "claim_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_decisions" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "decider_id" UUID NOT NULL,
    "level" "ClaimDecisionLevel" NOT NULL,
    "decision" "ClaimDecisionValue" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selection_cycles" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "term_start" TIMESTAMPTZ(6) NOT NULL,
    "term_end" TIMESTAMPTZ(6) NOT NULL,
    "applications_open_at" TIMESTAMPTZ(6) NOT NULL,
    "applications_close_at" TIMESTAMPTZ(6) NOT NULL,
    "max_applications_per_member" INTEGER NOT NULL DEFAULT 1,
    "status" "SelectionCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "selection_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selection_posts" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "role" "LeadershipRole" NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "min_membership_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "selection_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selection_questions" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "SelectionQuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "max_length" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "selection_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewer_note" TEXT,
    "interview_meeting_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_answers" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "application_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "appointed_by" UUID NOT NULL,
    "role_assignment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "before" JSONB,
    "after" JSONB,
    "ip_address" INET,
    "request_id" TEXT,
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "route" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_hash" TEXT,
    "response_body" JSONB,
    "status_code" INTEGER,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "ref_id" UUID NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "provider" "PaymentProvider" NOT NULL,
    "gateway_order_id" TEXT NOT NULL,
    "gateway_payment_id" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "purpose" "FilePurpose" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "attached_to_type" TEXT,
    "attached_to_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL,
    "to" CITEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "send_after" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "target_id" UUID NOT NULL,
    "proposed_value" JSONB NOT NULL,
    "current_value" JSONB NOT NULL,
    "requested_by" UUID NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "member_price_paise" BIGINT NOT NULL,
    "non_member_price_paise" BIGINT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "preorder_opens_at" TIMESTAMPTZ(6),
    "preorder_closes_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "sku" TEXT NOT NULL,
    "stock" INTEGER,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "adjusted_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "total_paise" BIGINT NOT NULL,
    "payment_id" UUID,
    "reservation_expires_at" TIMESTAMPTZ(6),
    "collected_at" TIMESTAMPTZ(6),
    "collected_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price_paise" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL,
    "event_id" UUID,
    "channels" "AnnouncementChannel"[],
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_corrections" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "body_md" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "status" "NewsletterSubscriberStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "unsubscribe_token_hash" TEXT NOT NULL,
    "confirm_token_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_consents" (
    "id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "action" "NewsletterConsentAction" NOT NULL,
    "source" "NewsletterConsentSource" NOT NULL,
    "ip" INET,
    "user_agent" TEXT,
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_campaigns" (
    "id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "status" "NewsletterCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skills" TEXT[],
    "availability_note" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProjectType" NOT NULL,
    "event_id" UUID,
    "goal_paise" BIGINT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "closed_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "source_meeting_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channels" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "is_read_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "client_msg_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "meeting_link" TEXT,
    "audience" "MeetingAudience" NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancel_reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_items" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "owner_id" UUID,
    "duration_min" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_invites" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "rsvp" "MeetingRsvp" NOT NULL DEFAULT 'PENDING',
    "rsvp_note" TEXT,
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meeting_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_attendance" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "present" BOOLEAN NOT NULL,
    "marked_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meeting_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_minutes" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "summary_md" TEXT NOT NULL,
    "decisions" JSONB NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "assignee_id" UUID NOT NULL,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "task_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_expires_at_idx" ON "refresh_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_revoked_at_idx" ON "refresh_tokens"("family_id", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_tokens_token_hash_key" ON "email_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_tokens_user_id_purpose_expires_at_idx" ON "email_tokens"("user_id", "purpose", "expires_at");

-- CreateIndex
CREATE INDEX "role_assignments_user_id_role_scope_type_scope_id_idx" ON "role_assignments"("user_id", "role", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "role_assignments_role_term_start_term_end_ended_at_idx" ON "role_assignments"("role", "term_start", "term_end", "ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tiers_name_key" ON "membership_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_cash_collection_id_key" ON "memberships"("cash_collection_id");

-- CreateIndex
CREATE INDEX "memberships_user_id_status_expires_at_idx" ON "memberships"("user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "memberships_tier_id_status_idx" ON "memberships"("tier_id", "status");

-- CreateIndex
CREATE INDEX "cash_collections_status_created_at_idx" ON "cash_collections"("status", "created_at");

-- CreateIndex
CREATE INDEX "cash_collections_purpose_ref_id_idx" ON "cash_collections"("purpose", "ref_id");

-- CreateIndex
CREATE INDEX "events_status_start_at_idx" ON "events"("status", "start_at");

-- CreateIndex
CREATE INDEX "events_visibility_status_start_at_idx" ON "events"("visibility", "status", "start_at");

-- CreateIndex
CREATE INDEX "event_budget_lines_event_id_idx" ON "event_budget_lines"("event_id");

-- CreateIndex
CREATE INDEX "event_reviews_event_id_created_at_idx" ON "event_reviews"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_types_event_id_audience_idx" ON "ticket_types"("event_id", "audience");

-- CreateIndex
CREATE INDEX "ticket_reservations_status_expires_at_idx" ON "ticket_reservations"("status", "expires_at");

-- CreateIndex
CREATE INDEX "ticket_reservations_user_id_ticket_type_id_status_idx" ON "ticket_reservations"("user_id", "ticket_type_id", "status");

-- CreateIndex
CREATE INDEX "tickets_event_id_status_idx" ON "tickets"("event_id", "status");

-- CreateIndex
CREATE INDEX "tickets_user_id_created_at_idx" ON "tickets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "tickets_ticket_type_id_status_idx" ON "tickets"("ticket_type_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_reverses_entry_id_key" ON "ledger_entries"("reverses_entry_id");

-- CreateIndex
CREATE INDEX "ledger_entries_occurred_at_idx" ON "ledger_entries"("occurred_at");

-- CreateIndex
CREATE INDEX "ledger_entries_event_id_occurred_at_idx" ON "ledger_entries"("event_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ledger_entries_project_id_occurred_at_idx" ON "ledger_entries"("project_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_source_type_source_id_key" ON "ledger_entries"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "budget_allocations_period_created_at_idx" ON "budget_allocations"("period", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "budget_limits_period_category_key" ON "budget_limits"("period", "category");

-- CreateIndex
CREATE INDEX "expense_claims_submitted_by_status_created_at_idx" ON "expense_claims"("submitted_by", "status", "created_at");

-- CreateIndex
CREATE INDEX "expense_claims_status_route_created_at_idx" ON "expense_claims"("status", "route", "created_at");

-- CreateIndex
CREATE INDEX "expense_claims_event_id_idx" ON "expense_claims"("event_id");

-- CreateIndex
CREATE INDEX "expense_claims_project_id_idx" ON "expense_claims"("project_id");

-- CreateIndex
CREATE INDEX "expense_claims_task_id_idx" ON "expense_claims"("task_id");

-- CreateIndex
CREATE INDEX "claim_receipts_file_id_idx" ON "claim_receipts"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "claim_receipts_claim_id_file_id_key" ON "claim_receipts"("claim_id", "file_id");

-- CreateIndex
CREATE INDEX "claim_decisions_claim_id_created_at_idx" ON "claim_decisions"("claim_id", "created_at");

-- CreateIndex
CREATE INDEX "claim_decisions_decider_id_created_at_idx" ON "claim_decisions"("decider_id", "created_at");

-- CreateIndex
CREATE INDEX "selection_cycles_status_applications_open_at_applications_c_idx" ON "selection_cycles"("status", "applications_open_at", "applications_close_at");

-- CreateIndex
CREATE UNIQUE INDEX "selection_posts_cycle_id_role_key" ON "selection_posts"("cycle_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "selection_questions_post_id_sort_order_key" ON "selection_questions"("post_id", "sort_order");

-- CreateIndex
CREATE INDEX "applications_applicant_id_status_idx" ON "applications"("applicant_id", "status");

-- CreateIndex
CREATE INDEX "applications_post_id_status_created_at_idx" ON "applications"("post_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "applications_post_id_applicant_id_key" ON "applications"("post_id", "applicant_id");

-- CreateIndex
CREATE INDEX "application_answers_question_id_idx" ON "application_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_answers_application_id_question_id_key" ON "application_answers"("application_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_application_id_key" ON "appointments"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_role_assignment_id_key" ON "appointments"("role_assignment_id");

-- CreateIndex
CREATE INDEX "appointments_post_id_created_at_idx" ON "appointments"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_at_idx" ON "audit_logs"("actor_id", "at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_at_idx" ON "audit_logs"("entity_type", "entity_id", "at");

-- CreateIndex
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_user_id_route_key" ON "idempotency_keys"("key", "user_id", "route");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_order_id_key" ON "payments"("gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_payment_id_key" ON "payments"("gateway_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_purpose_ref_id_idx" ON "payments"("purpose", "ref_id");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "files_storage_key_key" ON "files"("storage_key");

-- CreateIndex
CREATE INDEX "files_owner_id_purpose_created_at_idx" ON "files"("owner_id", "purpose", "created_at");

-- CreateIndex
CREATE INDEX "files_attached_to_type_attached_to_id_idx" ON "files"("attached_to_type", "attached_to_id");

-- CreateIndex
CREATE INDEX "email_outbox_status_send_after_idx" ON "email_outbox"("status", "send_after");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "approvals_status_type_created_at_idx" ON "approvals"("status", "type", "created_at");

-- CreateIndex
CREATE INDEX "approvals_requested_by_created_at_idx" ON "approvals"("requested_by", "created_at");

-- CreateIndex
CREATE INDEX "products_status_category_idx" ON "products"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_sort_order_key" ON "product_images"("product_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_file_id_key" ON "product_images"("product_id", "file_id");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_key" ON "variants"("sku");

-- CreateIndex
CREATE INDEX "variants_product_id_idx" ON "variants"("product_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_variant_id_created_at_idx" ON "stock_adjustments"("variant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_id_key" ON "orders"("payment_id");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_reservation_expires_at_idx" ON "orders"("status", "reservation_expires_at");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_variant_id_key" ON "order_items"("order_id", "variant_id");

-- CreateIndex
CREATE INDEX "announcements_status_scheduled_at_idx" ON "announcements"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "announcements_audience_published_at_idx" ON "announcements"("audience", "published_at");

-- CreateIndex
CREATE INDEX "announcement_corrections_announcement_id_created_at_idx" ON "announcement_corrections"("announcement_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_user_id_key" ON "newsletter_subscribers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_hash_key" ON "newsletter_subscribers"("unsubscribe_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_confirm_token_hash_key" ON "newsletter_subscribers"("confirm_token_hash");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_status_created_at_idx" ON "newsletter_subscribers"("status", "created_at");

-- CreateIndex
CREATE INDEX "newsletter_consents_subscriber_id_at_idx" ON "newsletter_consents"("subscriber_id", "at");

-- CreateIndex
CREATE INDEX "newsletter_campaigns_status_scheduled_at_idx" ON "newsletter_campaigns"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_user_id_key" ON "volunteers"("user_id");

-- CreateIndex
CREATE INDEX "volunteers_status_idx" ON "volunteers"("status");

-- CreateIndex
CREATE INDEX "projects_status_type_idx" ON "projects"("status", "type");

-- CreateIndex
CREATE INDEX "projects_event_id_idx" ON "projects"("event_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "tasks_due_at_status_idx" ON "tasks"("due_at", "status");

-- CreateIndex
CREATE INDEX "task_assignees_task_id_user_id_removed_at_idx" ON "task_assignees"("task_id", "user_id", "removed_at");

-- CreateIndex
CREATE INDEX "task_assignees_user_id_removed_at_idx" ON "task_assignees"("user_id", "removed_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channels_task_id_key" ON "chat_channels"("task_id");

-- CreateIndex
CREATE INDEX "chat_messages_channel_id_created_at_idx" ON "chat_messages"("channel_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_sender_id_client_msg_id_key" ON "chat_messages"("sender_id", "client_msg_id");

-- CreateIndex
CREATE INDEX "meetings_status_start_at_idx" ON "meetings"("status", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_items_meeting_id_sort_order_key" ON "agenda_items"("meeting_id", "sort_order");

-- CreateIndex
CREATE INDEX "meeting_invites_user_id_rsvp_idx" ON "meeting_invites"("user_id", "rsvp");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_invites_meeting_id_user_id_key" ON "meeting_invites"("meeting_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_attendance_meeting_id_user_id_key" ON "meeting_attendance"("meeting_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_minutes_meeting_id_key" ON "meeting_minutes"("meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "action_items_task_id_key" ON "action_items"("task_id");

-- CreateIndex
CREATE INDEX "action_items_assignee_id_due_at_idx" ON "action_items"("assignee_id", "due_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parent_token_id_fkey" FOREIGN KEY ("parent_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "membership_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_cash_collection_id_fkey" FOREIGN KEY ("cash_collection_id") REFERENCES "cash_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_budget_lines" ADD CONSTRAINT "event_budget_lines_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_reservations" ADD CONSTRAINT "ticket_reservations_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_reservations" ADD CONSTRAINT "ticket_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_reservations" ADD CONSTRAINT "ticket_reservations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_reverses_entry_id_fkey" FOREIGN KEY ("reverses_entry_id") REFERENCES "ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_allocated_by_fkey" FOREIGN KEY ("allocated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_receipts" ADD CONSTRAINT "claim_receipts_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_receipts" ADD CONSTRAINT "claim_receipts_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_decisions" ADD CONSTRAINT "claim_decisions_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_decisions" ADD CONSTRAINT "claim_decisions_decider_id_fkey" FOREIGN KEY ("decider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_cycles" ADD CONSTRAINT "selection_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_posts" ADD CONSTRAINT "selection_posts_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "selection_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selection_questions" ADD CONSTRAINT "selection_questions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "selection_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "selection_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_interview_meeting_id_fkey" FOREIGN KEY ("interview_meeting_id") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "selection_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "selection_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_appointed_by_fkey" FOREIGN KEY ("appointed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_role_assignment_id_fkey" FOREIGN KEY ("role_assignment_id") REFERENCES "role_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_corrections" ADD CONSTRAINT "announcement_corrections_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_corrections" ADD CONSTRAINT "announcement_corrections_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_consents" ADD CONSTRAINT "newsletter_consents_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "newsletter_subscribers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_meeting_id_fkey" FOREIGN KEY ("source_meeting_id") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "chat_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Database invariants that Prisma's schema language cannot express.
ALTER TABLE "role_assignments"
  ADD CONSTRAINT "role_assignments_scope_pair_check" CHECK (("scope_type" IS NULL) = ("scope_id" IS NULL)),
  ADD CONSTRAINT "role_assignments_term_check" CHECK ("term_start" < "term_end" AND ("ended_at" IS NULL OR "ended_at" >= "term_start"));

CREATE UNIQUE INDEX "role_assignments_one_open_leader_per_role"
  ON "role_assignments" ("role")
  WHERE "ended_at" IS NULL
    AND "role" IN ('VOLUNTEER_HEAD', 'EVENT_HEAD', 'MARKETING_HEAD', 'TREASURER', 'PRESIDENT');

ALTER TABLE "membership_tiers"
  ADD CONSTRAINT "membership_tiers_price_check" CHECK ("price_paise" >= 0);

ALTER TABLE "memberships"
  ADD CONSTRAINT "memberships_dates_check" CHECK ("starts_at" IS NULL OR "expires_at" IS NULL OR "starts_at" < "expires_at"),
  ADD CONSTRAINT "memberships_active_payment_check" CHECK (
    "status" <> 'ACTIVE'
    OR ("source" = 'ONLINE' AND "payment_id" IS NOT NULL AND "cash_collection_id" IS NULL)
    OR ("source" = 'CASH' AND "cash_collection_id" IS NOT NULL AND "payment_id" IS NULL)
  ),
  ADD CONSTRAINT "memberships_card_secret_version_check" CHECK ("card_secret_version" > 0);

CREATE UNIQUE INDEX "memberships_one_active_per_user"
  ON "memberships" ("user_id") WHERE "status" = 'ACTIVE';

ALTER TABLE "cash_collections"
  ADD CONSTRAINT "cash_collections_amount_check" CHECK ("amount_paise" > 0),
  ADD CONSTRAINT "cash_collections_resolution_check" CHECK (
    ("status" = 'PENDING_VERIFICATION' AND "verified_by" IS NULL AND "verified_at" IS NULL)
    OR ("status" = 'VERIFIED' AND "verified_by" IS NOT NULL AND "verified_at" IS NOT NULL AND "reject_reason" IS NULL)
    OR ("status" = 'REJECTED' AND "verified_by" IS NOT NULL AND "verified_at" IS NOT NULL AND "reject_reason" IS NOT NULL)
  );

ALTER TABLE "events"
  ADD CONSTRAINT "events_schedule_check" CHECK ("start_at" < "end_at"),
  ADD CONSTRAINT "events_capacity_check" CHECK ("capacity" > 0 AND "seats_sold" >= 0 AND "seats_sold" <= "capacity"),
  ADD CONSTRAINT "events_volunteers_check" CHECK ("volunteers_needed" >= 0),
  ADD CONSTRAINT "events_budget_check" CHECK ("approved_budget_paise" IS NULL OR "approved_budget_paise" >= 0);

ALTER TABLE "event_budget_lines"
  ADD CONSTRAINT "event_budget_lines_amount_check" CHECK ("amount_paise" >= 0);

ALTER TABLE "ticket_types"
  ADD CONSTRAINT "ticket_types_price_check" CHECK ("price_paise" >= 0),
  ADD CONSTRAINT "ticket_types_inventory_check" CHECK ("quota" > 0 AND "sold" >= 0 AND "sold" <= "quota"),
  ADD CONSTRAINT "ticket_types_limit_check" CHECK ("max_per_user" BETWEEN 1 AND 10),
  ADD CONSTRAINT "ticket_types_sales_window_check" CHECK ("sales_start_at" < "sales_end_at");

ALTER TABLE "ticket_reservations"
  ADD CONSTRAINT "ticket_reservations_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_price_check" CHECK ("price_paid_paise" >= 0),
  ADD CONSTRAINT "tickets_check_in_check" CHECK (
    ("status" = 'CHECKED_IN' AND "checked_in_at" IS NOT NULL AND "checked_in_by" IS NOT NULL)
    OR ("status" <> 'CHECKED_IN' AND "checked_in_at" IS NULL AND "checked_in_by" IS NULL)
  );

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_amount_check" CHECK ("amount_paise" > 0),
  ADD CONSTRAINT "ledger_entries_reversal_check" CHECK (("source_type" = 'REVERSAL') = ("reverses_entry_id" IS NOT NULL));

ALTER TABLE "budget_allocations"
  ADD CONSTRAINT "budget_allocations_amount_check" CHECK ("amount_paise" > 0);

ALTER TABLE "budget_limits"
  ADD CONSTRAINT "budget_limits_amount_check" CHECK ("limit_paise" >= 0);

ALTER TABLE "expense_claims"
  ADD CONSTRAINT "expense_claims_amount_check" CHECK ("amount_paise" > 0),
  ADD CONSTRAINT "expense_claims_link_check" CHECK ("event_id" IS NOT NULL OR "project_id" IS NOT NULL OR "task_id" IS NOT NULL),
  ADD CONSTRAINT "expense_claims_payment_check" CHECK (
    ("status" = 'PAID' AND "paid_method" IS NOT NULL AND "paid_reference" IS NOT NULL AND "paid_at" IS NOT NULL)
    OR ("status" <> 'PAID' AND "paid_at" IS NULL)
  );

ALTER TABLE "selection_cycles"
  ADD CONSTRAINT "selection_cycles_term_check" CHECK ("term_start" < "term_end"),
  ADD CONSTRAINT "selection_cycles_application_window_check" CHECK ("applications_open_at" < "applications_close_at"),
  ADD CONSTRAINT "selection_cycles_application_limit_check" CHECK ("max_applications_per_member" BETWEEN 1 AND 3);

ALTER TABLE "selection_posts"
  ADD CONSTRAINT "selection_posts_seats_check" CHECK ("seats" > 0),
  ADD CONSTRAINT "selection_posts_membership_days_check" CHECK ("min_membership_days" >= 0);

ALTER TABLE "selection_questions"
  ADD CONSTRAINT "selection_questions_sort_order_check" CHECK ("sort_order" >= 0),
  ADD CONSTRAINT "selection_questions_max_length_check" CHECK ("max_length" IS NULL OR "max_length" > 0),
  ADD CONSTRAINT "selection_questions_options_check" CHECK (
    ("type" IN ('SINGLE_CHOICE', 'MULTI_CHOICE') AND "options" IS NOT NULL)
    OR ("type" IN ('TEXT', 'TEXTAREA') AND "options" IS NULL)
  );

ALTER TABLE "idempotency_keys"
  ADD CONSTRAINT "idempotency_keys_status_code_check" CHECK ("status_code" IS NULL OR "status_code" BETWEEN 100 AND 599);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_check" CHECK ("amount_paise" > 0),
  ADD CONSTRAINT "payments_paid_check" CHECK (
    ("status" IN ('PAID', 'REFUNDED') AND "gateway_payment_id" IS NOT NULL AND "paid_at" IS NOT NULL)
    OR ("status" NOT IN ('PAID', 'REFUNDED') AND "paid_at" IS NULL)
  );

ALTER TABLE "files"
  ADD CONSTRAINT "files_size_check" CHECK ("size_bytes" > 0),
  ADD CONSTRAINT "files_attachment_pair_check" CHECK (("attached_to_type" IS NULL) = ("attached_to_id" IS NULL));

ALTER TABLE "email_outbox"
  ADD CONSTRAINT "email_outbox_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5);

ALTER TABLE "approvals"
  ADD CONSTRAINT "approvals_no_self_decision_check" CHECK ("decided_by" IS NULL OR "decided_by" <> "requested_by"),
  ADD CONSTRAINT "approvals_resolution_check" CHECK (
    ("status" = 'PENDING' AND "decided_by" IS NULL AND "decided_at" IS NULL)
    OR ("status" IN ('APPROVED', 'REJECTED') AND "decided_by" IS NOT NULL AND "decided_at" IS NOT NULL)
  );

ALTER TABLE "products"
  ADD CONSTRAINT "products_prices_check" CHECK ("member_price_paise" > 0 AND "non_member_price_paise" >= "member_price_paise"),
  ADD CONSTRAINT "products_preorder_window_check" CHECK (
    ("preorder_opens_at" IS NULL AND "preorder_closes_at" IS NULL)
    OR ("preorder_opens_at" IS NOT NULL AND "preorder_closes_at" IS NOT NULL AND "preorder_opens_at" < "preorder_closes_at")
  );

ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_sort_order_check" CHECK ("sort_order" >= 0);

ALTER TABLE "variants"
  ADD CONSTRAINT "variants_inventory_check" CHECK (
    "reserved" >= 0 AND ("stock" IS NULL OR ("stock" >= 0 AND "reserved" <= "stock"))
  );

ALTER TABLE "stock_adjustments"
  ADD CONSTRAINT "stock_adjustments_delta_check" CHECK ("delta" <> 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_total_check" CHECK ("total_paise" >= 0),
  ADD CONSTRAINT "orders_collection_check" CHECK (
    ("status" = 'COLLECTED' AND "collected_at" IS NOT NULL AND "collected_by" IS NOT NULL)
    OR ("status" <> 'COLLECTED' AND "collected_at" IS NULL AND "collected_by" IS NULL)
  );

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_check" CHECK ("qty" > 0),
  ADD CONSTRAINT "order_items_price_check" CHECK ("unit_price_paise" >= 0);

ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_event_audience_check" CHECK (("audience" = 'EVENT_ATTENDEES') = ("event_id" IS NOT NULL)),
  ADD CONSTRAINT "announcements_channels_check" CHECK (cardinality("channels") BETWEEN 1 AND 2),
  ADD CONSTRAINT "announcements_public_channel_check" CHECK ("audience" <> 'PUBLIC' OR NOT ('EMAIL' = ANY("channels"))),
  ADD CONSTRAINT "announcements_publish_check" CHECK (
    ("status" = 'PUBLISHED' AND "published_at" IS NOT NULL)
    OR ("status" <> 'PUBLISHED' AND "published_at" IS NULL)
  );

ALTER TABLE "newsletter_campaigns"
  ADD CONSTRAINT "newsletter_campaigns_sent_count_check" CHECK ("sent_count" >= 0);

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_dates_check" CHECK ("start_date" <= "end_date"),
  ADD CONSTRAINT "projects_goal_check" CHECK ("goal_paise" IS NULL OR "goal_paise" >= 0);

ALTER TABLE "task_assignees"
  ADD CONSTRAINT "task_assignees_dates_check" CHECK ("removed_at" IS NULL OR "removed_at" >= "assigned_at");

CREATE UNIQUE INDEX "task_assignees_one_active_assignment"
  ON "task_assignees" ("task_id", "user_id") WHERE "removed_at" IS NULL;

ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_body_check" CHECK (char_length("body") BETWEEN 1 AND 2000);

ALTER TABLE "meetings"
  ADD CONSTRAINT "meetings_schedule_check" CHECK ("start_at" < "end_at"),
  ADD CONSTRAINT "meetings_cancel_check" CHECK ("status" <> 'CANCELLED' OR "cancel_reason" IS NOT NULL);

ALTER TABLE "agenda_items"
  ADD CONSTRAINT "agenda_items_sort_order_check" CHECK ("sort_order" >= 0),
  ADD CONSTRAINT "agenda_items_duration_check" CHECK ("duration_min" BETWEEN 1 AND 240);

ALTER TABLE "meeting_invites"
  ADD CONSTRAINT "meeting_invites_response_check" CHECK (
    ("rsvp" = 'PENDING' AND "responded_at" IS NULL)
    OR ("rsvp" <> 'PENDING' AND "responded_at" IS NOT NULL)
  ),
  ADD CONSTRAINT "meeting_invites_required_no_note_check" CHECK (
    NOT ("is_required" AND "rsvp" = 'NO') OR "rsvp_note" IS NOT NULL
  );

-- Append-only records retain history even if application code is bypassed.
CREATE FUNCTION "prevent_append_only_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ledger_entries_append_only" BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
CREATE TRIGGER "event_reviews_append_only" BEFORE UPDATE OR DELETE ON "event_reviews"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
CREATE TRIGGER "claim_decisions_append_only" BEFORE UPDATE OR DELETE ON "claim_decisions"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
CREATE TRIGGER "audit_logs_append_only" BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
CREATE TRIGGER "stock_adjustments_append_only" BEFORE UPDATE OR DELETE ON "stock_adjustments"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
CREATE TRIGGER "announcement_corrections_append_only" BEFORE UPDATE OR DELETE ON "announcement_corrections"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
CREATE TRIGGER "newsletter_consents_append_only" BEFORE UPDATE OR DELETE ON "newsletter_consents"
  FOR EACH ROW EXECUTE FUNCTION "prevent_append_only_mutation"();
