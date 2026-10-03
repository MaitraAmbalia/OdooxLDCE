-- Add the sponsorship leadership role used to authorize Odoo CRM access.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SPONSORSHIP_HEAD';
ALTER TYPE "LeadershipRole" ADD VALUE IF NOT EXISTS 'SPONSORSHIP_HEAD';

-- PostgreSQL requires this enum transaction to commit before a later migration
-- may reference SPONSORSHIP_HEAD in an index predicate.
