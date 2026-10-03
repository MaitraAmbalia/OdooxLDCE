-- Event-owned sponsorship brief. CRM contacts and opportunities remain in Odoo.
ALTER TABLE "events"
  ADD COLUMN "sponsorship_required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sponsorship_target_paise" BIGINT,
  ADD COLUMN "sponsorship_deadline" TIMESTAMPTZ(6),
  ADD COLUMN "sponsorship_pitch" TEXT,
  ADD COLUMN "sponsorship_packages" JSONB,
  ADD COLUMN "sponsor_benefits" TEXT;

ALTER TABLE "events"
  ADD CONSTRAINT "events_sponsorship_brief_check" CHECK (
    NOT "sponsorship_required"
    OR (
      "sponsorship_target_paise" IS NOT NULL
      AND "sponsorship_target_paise" > 0
      AND "sponsorship_deadline" IS NOT NULL
      AND NULLIF(BTRIM("sponsorship_pitch"), '') IS NOT NULL
      AND "sponsorship_packages" IS NOT NULL
      AND jsonb_typeof("sponsorship_packages") = 'array'
      AND jsonb_array_length("sponsorship_packages") > 0
      AND NULLIF(BTRIM("sponsor_benefits"), '') IS NOT NULL
    )
  );

-- Preserve the one-current-holder invariant for the new leadership role.
DROP INDEX IF EXISTS "role_assignments_one_open_leader_per_role";
CREATE UNIQUE INDEX "role_assignments_one_open_leader_per_role"
  ON "role_assignments" ("role")
  WHERE "ended_at" IS NULL
    AND "role" IN ('VOLUNTEER_HEAD', 'EVENT_HEAD', 'MARKETING_HEAD', 'SPONSORSHIP_HEAD', 'TREASURER', 'PRESIDENT');
