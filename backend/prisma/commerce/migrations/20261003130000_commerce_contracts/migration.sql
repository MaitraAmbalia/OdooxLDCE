CREATE SCHEMA IF NOT EXISTS commerce;
CREATE VIEW commerce.v_member_status AS
SELECT NULL::uuid AS user_id, NULL::text AS status,
       NULL::timestamptz AS active_since, NULL::timestamptz AS expires_at WHERE false;
CREATE VIEW commerce.v_active_members AS SELECT NULL::uuid AS user_id WHERE false;
CREATE VIEW commerce.v_event_attendees AS SELECT NULL::uuid AS event_id, NULL::uuid AS user_id WHERE false;
CREATE VIEW commerce.v_events AS
SELECT NULL::uuid AS id, NULL::text AS title, NULL::timestamptz AS start_at,
       NULL::timestamptz AS end_at, NULL::text AS status WHERE false;
