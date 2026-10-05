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

export function getEventCover(event) {
  if (!event) return null;
  if (event.coverImageUrl) return event.coverImageUrl;
  const title = (event.title || "").toLowerCase();
  const category = (event.category || "").toUpperCase();

  // Specific high-priority title matches
  if (title.includes("open mic") || title.includes("poetry") || title.includes("acoustic")) {
    return "/banners/open_mic_poetry.jpg";
  }
  if (title.includes("esport") || title.includes("valorant") || title.includes("gaming") || title.includes("bgmi")) {
    return "/banners/esports_championship.jpg";
  }
  if (title.includes("robowars") || title.includes("drone") || title.includes("combat robot") || title.includes("rocketry") || title.includes("aerospace")) {
    return "/banners/robowars_drones.jpg";
  }
  if (title.includes("cultural") || title.includes("raas") || title.includes("garba") || title.includes("dance") || title.includes("bands")) {
    return "/banners/cultural_night_raas.jpg";
  }
  if (title.includes("tedx") || title.includes("conclave") || title.includes("symposium") && !title.includes("workshop")) {
    return "/banners/tedx_talks.jpg";
  }
  if (title.includes("sports") || title.includes("clash of departments") || title.includes("cricket") || title.includes("football") || title.includes("athlete")) {
    return "/banners/sports_meet.jpg";
  }
  if (
    title.includes("workshop") ||
    title.includes("bootcamp") ||
    title.includes("full stack") ||
    title.includes("ai &") ||
    title.includes("machine learning") ||
    title.includes("fintech") ||
    title.includes("install-fest")
  ) {
    return "/banners/ai_workshop.jpg";
  }
  if (
    event.id === "30000000-0000-0000-0000-000000000002" ||
    title.includes("hackathon") ||
    title.includes("codewave") ||
    title.includes("ctf") ||
    title.includes("devfest")
  ) {
    return "/banners/codewave_hackathon_2026.jpg";
  }
  if (
    event.id === "00000000-0000-0000-0000-000000000001" ||
    title.includes("gala") ||
    title.includes("spring gala") ||
    title.includes("awards")
  ) {
    return "/banners/spring_gala_2026.jpg";
  }

  // Category-based fallbacks
  switch (category) {
    case "GALA":
      return "/banners/spring_gala_2026.jpg";
    case "HACKATHON":
      return "/banners/codewave_hackathon_2026.jpg";
    case "COMPETITION":
      return "/banners/robowars_drones.jpg";
    case "SPORTS":
      return "/banners/sports_meet.jpg";
    case "CULTURAL":
      return "/banners/cultural_night_raas.jpg";
    case "CONFERENCE":
      return "/banners/tedx_talks.jpg";
    case "WORKSHOP":
    case "ACADEMIC":
      return "/banners/ai_workshop.jpg";
    case "SOCIAL":
      return "/banners/open_mic_poetry.jpg";
    case "EXHIBITION":
      return "/banners/robowars_drones.jpg";
    default:
      return "/banners/spring_gala_2026.jpg";
  }
}

