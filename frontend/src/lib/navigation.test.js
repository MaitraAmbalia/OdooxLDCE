import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceNavigation, PUBLIC_NAVIGATION } from "./navigation.js";

const publicPaths = new Set(PUBLIC_NAVIGATION.map(([path]) => path));

test("public navigation stays identical and contains the shared destinations", () => {
  assert.deepEqual([...publicPaths], ["/events", "/shop", "/calendar", "/announcements"]);
});

test("leadership navigation is permission-driven and excludes public links", () => {
  const workspace = getWorkspaceNavigation({
    roles: ["TREASURER"],
    permissions: ["ledger.read", "cash.verify", "sponsorship.crm.read"],
  });
  const paths = workspace.links.map(([path]) => path);

  assert.equal(workspace.label, "Treasurer workspace");
  assert(paths.includes("/manage/finance/ledger"));
  assert(paths.includes("/manage/cash"));
  assert(paths.includes("/manage/sponsorship"));
  assert(!paths.includes("/manage/projects"));
  assert(paths.every((path) => !publicPaths.has(path)));
});

test("multi-role users receive the union of authorized workspaces", () => {
  const workspace = getWorkspaceNavigation({
    roles: ["EVENT_HEAD", "VOLUNTEER_HEAD"],
    permissions: ["event.propose", "project.manage", "claim.submit"],
  });
  const paths = workspace.links.map(([path]) => path);

  assert.equal(workspace.label, "Leadership workspace");
  assert(paths.includes("/manage/events"));
  assert(paths.includes("/manage/projects"));
  assert(paths.includes("/volunteer"));
  assert(paths.includes("/volunteer/claims/new"));
});

test("students and volunteers receive personal links without public duplicates", () => {
  const student = getWorkspaceNavigation({ roles: [], membership: { status: "ACTIVE" } });
  const volunteer = getWorkspaceNavigation({ roles: [], isVolunteer: true });

  assert(student.links.some(([path]) => path === "/selection"));
  assert(volunteer.links.some(([path]) => path === "/volunteer"));
  assert([...student.links, ...volunteer.links].every(([path]) => !publicPaths.has(path)));
});
