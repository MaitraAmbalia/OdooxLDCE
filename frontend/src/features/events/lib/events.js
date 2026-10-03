const timeZone = "Asia/Kolkata";

export function eventDate(event) {
  const value = event.startAt || event.startDate;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPastEvent(event, now = Date.now()) {
  const end = event.endAt || event.endDate;
  const date = end ? new Date(end) : eventDate(event);
  return date && !Number.isNaN(date.getTime()) ? date.getTime() < now : false;
}

export function categoryLabel(value = "GENERAL") {
  return String(value || "GENERAL")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatEventDate(
  event,
  options = { day: "numeric", month: "short" },
) {
  const date = eventDate(event);
  return date
    ? new Intl.DateTimeFormat("en-IN", { timeZone, ...options }).format(date)
    : "Date to be announced";
}

export function eventPrice(event) {
  const prices = (event.ticketTypes || [])
    .filter(
      (ticket) =>
        ticket.pricePaise !== null &&
        ticket.pricePaise !== undefined,
    )
    .map((ticket) => Number(ticket.pricePaise))
    .filter((price) => Number.isFinite(price) && price >= 0);
  if (!prices.length) return "See ticket options";
  const minimum = Math.min(...prices);
  if (minimum === 0) return "Free entry available";
  return `From ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(minimum / 100)}`;
}

export function filterEvents(
  events,
  { search = "", category = "ALL", period = "upcoming", sort = "soonest" } = {},
  now = Date.now(),
) {
  const query = search.trim().toLowerCase();
  return events
    .filter((event) => {
      const matchesSearch = [event.title, event.description, event.venue].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
      );
      const matchesCategory =
        category === "ALL" ||
        (event.category || "GENERAL").toUpperCase() === category;
      const past = isPastEvent(event, now);
      return (
        matchesSearch &&
        matchesCategory &&
        (period === "all" || (period === "past" ? past : !past))
      );
    })
    .sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      const aDate = eventDate(a)?.getTime();
      const bDate = eventDate(b)?.getTime();
      if (aDate == null) return bDate == null ? 0 : 1;
      if (bDate == null) return -1;
      return sort === "latest" ? bDate - aDate : aDate - bDate;
    });
}
