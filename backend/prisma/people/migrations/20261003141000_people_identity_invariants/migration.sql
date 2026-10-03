CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
ALTER TABLE people.role_assignments ADD CONSTRAINT role_term_valid CHECK (term_end > term_start);
ALTER TABLE people.role_assignments ADD CONSTRAINT leadership_terms_exclusive
EXCLUDE USING gist (role WITH =,
  tstzrange(term_start, GREATEST(term_start, LEAST(term_end, COALESCE(ended_at, term_end))), '[)') WITH &&)
WHERE (role <> 'MENTOR');
ALTER TABLE people.email_tokens ADD CONSTRAINT email_attempts_nonnegative CHECK (failed_attempts >= 0);
ALTER TABLE people.files ADD CONSTRAINT file_size_valid CHECK (byte_size BETWEEN 1 AND 5242880);
ALTER TABLE people.volunteers ADD CONSTRAINT volunteer_status_valid CHECK (status IN ('ACTIVE', 'INACTIVE'));

CREATE OR REPLACE VIEW people.v_users AS
SELECT id, name, student_id, is_disabled FROM people.users;

CREATE FUNCTION people.reject_consent_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Newsletter consent logs are append-only'; END;
$$;
CREATE TRIGGER newsletter_consent_append_only BEFORE UPDATE OR DELETE ON people.newsletter_consents
FOR EACH ROW EXECUTE FUNCTION people.reject_consent_mutation();
