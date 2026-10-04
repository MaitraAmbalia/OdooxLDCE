import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultLandingPath, getPostLoginPath } from "./access.js";

test("leadership personas ignore stale management redirects", () => {
  assert.equal(getPostLoginPath({ roles: ["MENTOR"] }, "/manage/sponsorship"), "/manage");
  assert.equal(getPostLoginPath({ roles: ["EVENT_HEAD"] }, "/manage/sponsorship"), "/manage/events");
  assert.equal(getPostLoginPath({ roles: ["TREASURER"] }, "/manage/sponsorship"), "/manage/finance/ledger");
  assert.equal(getPostLoginPath({ roles: ["VOLUNTEER_HEAD"] }, "/manage/sponsorship"), "/manage/projects");
  assert.equal(getPostLoginPath({ roles: ["MARKETING_HEAD"] }, "/manage/sponsorship"), "/manage/newsletter");
  assert.equal(getPostLoginPath({ roles: ["SPONSORSHIP_HEAD"] }, "/manage/events"), "/manage/sponsorship");
});

test("non-leadership users keep safe account redirects", () => {
  assert.equal(getPostLoginPath({ roles: [] }, "/me/tickets"), "/me/tickets");
  assert.equal(getPostLoginPath({ roles: [], isVolunteer: true }, "/manage/sponsorship"), "/volunteer");
  assert.equal(getDefaultLandingPath({ roles: [] }), "/me");
});
