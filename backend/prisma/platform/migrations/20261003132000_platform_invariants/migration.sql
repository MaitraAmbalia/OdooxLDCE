CREATE FUNCTION platform.reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit logs are append-only'; END;
$$;
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON platform.audit_logs
FOR EACH ROW EXECUTE FUNCTION platform.reject_audit_mutation();

INSERT INTO platform.settings (key, value, updated_at) VALUES
('club.name', '"Skyline Student Association"', now()),
('club.academicYearEnd', '"05-31"', now()),
('merch.nonMemberPurchase', 'false', now()),
('membership.renewalWindowDays', '30', now()),
('membership.reminderDays', '[30,7]', now()),
('claims.highValueThresholdPaise', '200000', now()),
('claims.maxAgeDays', '30', now()),
('events.reapprovalBudgetPct', '10', now()),
('events.largeEventCapacity', '200', now()),
('tickets.reservationMinutes', '10', now()),
('orders.reservationMinutes', '15', now());
