import test from "node:test";
import assert from "node:assert/strict";
import {
  eventDate,
  eventPrice,
  filterEvents,
  formatEventDate,
  isPastEvent,
} from "./events.js";

test("listing prices never assume eligibility for member-only tickets", () => {
  assert.equal(
    eventPrice({
      ticketTypes: [
        { audience: "MEMBERS", pricePaise: 1000 },
        { audience: "ALL", pricePaise: 25000 },
      ],
    }),
    "From ₹250.00",
  );
  assert.equal(
    eventPrice({ ticketTypes: [{ audience: "MEMBERS", pricePaise: 1000 }] }),
    "See ticket options",
  );
});

test("unknown and invalid prices are not advertised as free", () => {
  assert.equal(
    eventPrice({
      ticketTypes: [
        { audience: "ALL", pricePaise: null },
        { audience: "ALL", pricePaise: "bad" },
      ],
    }),
    "See ticket options",
  );
  assert.equal(
    eventPrice({ ticketTypes: [{ audience: "ALL", pricePaise: 0 }] }),
    "Free entry available",
  );
});

test("missing dates are explicit and dates consistently use IST", () => {
  assert.equal(eventDate({}), null);
  assert.equal(eventDate({ startAt: "invalid" }), null);
  assert.equal(formatEventDate({}), "Date to be announced");
  assert.equal(
    formatEventDate({ startAt: "2026-10-03T23:00:00Z" }, { day: "numeric" }),
    "4",
  );
});

test("ongoing events remain discoverable until their end time", () => {
  const now = Date.parse("2026-10-03T12:00:00Z");
  assert.equal(
    isPastEvent(
      { startAt: "2026-10-03T10:00:00Z", endAt: "2026-10-03T15:00:00Z" },
      now,
    ),
    false,
  );
  assert.equal(
    isPastEvent(
      { startAt: "2026-10-02T10:00:00Z", endAt: "2026-10-02T15:00:00Z" },
      now,
    ),
    true,
  );
});

test("search, date, and category filters compose without mutating cached events", () => {
  const events = [
    {
      id: 1,
      title: "Later",
      category: "WORKSHOP",
      venue: "Studio",
      startAt: "2026-10-08",
    },
    {
      id: 2,
      title: "Earlier",
      category: "WORKSHOP",
      venue: "Studio",
      startAt: "2026-10-05",
    },
    {
      id: 3,
      title: "Past",
      category: "SOCIAL",
      venue: "Studio",
      startAt: "2026-09-01",
    },
    { id: 4, title: "Unscheduled", category: "WORKSHOP", venue: "Studio" },
  ];
  const now = Date.parse("2026-10-03");
  assert.deepEqual(
    filterEvents(events, { search: " STUDIO ", category: "WORKSHOP" }, now).map(
      (e) => e.id,
    ),
    [2, 1, 4],
  );
  assert.deepEqual(
    filterEvents(events, { period: "past" }, now).map((e) => e.id),
    [3],
  );
  assert.deepEqual(
    filterEvents(events, { sort: "latest" }, now).map((e) => e.id),
    [1, 2, 4],
  );
  assert.deepEqual(
    events.map((e) => e.id),
    [1, 2, 3, 4],
  );
});
