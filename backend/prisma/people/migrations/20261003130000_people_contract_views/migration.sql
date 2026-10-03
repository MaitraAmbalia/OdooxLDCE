CREATE SCHEMA IF NOT EXISTS "people";

-- Producer-owned, empty contracts. Keep column order, names and types frozen.
CREATE VIEW people.v_users AS
SELECT NULL::uuid AS id, NULL::text AS name, NULL::text AS student_id,
       NULL::boolean AS is_disabled WHERE false;

CREATE VIEW people.v_active_volunteers AS
SELECT NULL::uuid AS user_id WHERE false;

CREATE VIEW people.v_projects AS
SELECT NULL::uuid AS id, NULL::text AS name, NULL::text AS type,
       NULL::text AS status WHERE false;

CREATE VIEW people.v_active_task_assignments AS
SELECT NULL::uuid AS task_id, NULL::uuid AS project_id, NULL::uuid AS user_id
WHERE false;
