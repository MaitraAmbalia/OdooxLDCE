import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  MapPin,
  Plus,
  Search,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContentState } from "@/components/common/ContentState";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSession } from "@/hooks/useSession";
import { useEvents } from "../hooks/useEvents";
import { categoryLabel, eventDate, getEventCover } from "../lib/events";
import { SocialShareModal } from "@/components/common/SocialShareModal";

const LEAD_PERMISSIONS = ["event.approve", "event.propose", "event.publish"];
const PROPOSAL_STATUSES = ["PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED"];
const CATEGORY_COLORS = {
  ACADEMIC: "calendar-event-blue",
  WORKSHOP: "calendar-event-violet",
  SPORTS: "calendar-event-green",
  CULTURAL: "calendar-event-rose",
  SOCIAL: "calendar-event-orange",
};
const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) ===
    b.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function eventRange(event) {
  const start = eventDate(event);
  const endValue = event.endAt || event.endDate;
  const end = endValue ? new Date(endValue) : null;
  if (!start) return "Date to be announced";
  const date = DATE_FORMAT.format(start);
  if (!end || Number.isNaN(end.getTime())) return `${date} · ${TIME_FORMAT.format(start)}`;
  return sameDay(start, end)
    ? `${date} · ${TIME_FORMAT.format(start)}–${TIME_FORMAT.format(end)}`
    : `${date}, ${TIME_FORMAT.format(start)} – ${DATE_FORMAT.format(end)}, ${TIME_FORMAT.format(end)}`;
}

function countdown(event) {
  const start = eventDate(event);
  const end = new Date(event.endAt || event.endDate || event.startAt || event.startDate);
  const now = Date.now();
  if (start && start.getTime() <= now && end.getTime() >= now) return "Happening now";
  if (!start || start.getTime() < now) return null;
  const minutes = Math.round((start.getTime() - now) / 60_000);
  if (minutes < 60) return `Starts in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Starts in ${hours} hr${hours === 1 ? "" : "s"}`;
  const days = Math.ceil(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

function escapeIcs(value = "") {
  return String(value).replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function toIcsDate(value) {
  return new Date(value).toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function downloadIcs(event) {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skyline//Campus Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@skyline`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.startAt || event.startDate)}`,
    `DTEND:${toIcsDate(event.endAt || event.endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.venue)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title || "skyline-event"}.ics`.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
  anchor.click();
  URL.revokeObjectURL(url);
}

function CalendarEvent({ event }) {
  const item = event.extendedProps.item;
  const actualStart = eventDate(item);
  const proposed = item.status !== "PUBLISHED";
  return (
    <div className="calendar-event-content min-w-0 px-1 py-0.5">
      <div className="flex min-w-0 items-center gap-1.5">
        {proposed && <span className="size-1.5 shrink-0 rounded-full bg-current" />}
        <span className="truncate font-semibold">{event.title}</span>
      </div>
      {actualStart && <span className="calendar-event-time block truncate opacity-75">{TIME_FORMAT.format(actualStart)}</span>}
    </div>
  );
}

function MiniEvent({ event, onSelect, saved, onSave }) {
  const date = eventDate(event);
  return (
    <div className="group flex w-full items-start rounded-xl border border-transparent transition hover:border-border hover:bg-secondary/50">
      <button type="button" onClick={() => onSelect(event)} className="flex min-w-0 flex-1 items-start gap-3 p-2.5 text-left">
        <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-secondary px-1 py-1.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{date ? date.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }) : "TBA"}</span>
          <span className="font-display text-lg font-bold leading-5">{date ? date.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }) : "–"}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{event.title}</span>
          <span className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><Clock3 className="size-3" />{date ? TIME_FORMAT.format(date) : "Time TBA"}</span>
        </span>
      </button>
      {onSave && (
        <button
          type="button"
          aria-label={saved ? "Remove saved event" : "Save event"}
          onClick={() => onSave(event.id)}
          className={cn("m-2 rounded-md p-1.5 text-muted-foreground hover:bg-card hover:text-primary", saved && "text-primary")}
        >
          <Bookmark className={cn("size-4", saved && "fill-current")} />
        </button>
      )}
    </div>
  );
}

export default function EventCalendar() {
  usePageTitle("Campus calendar");
  const calendarRef = useRef(null);
  const navigate = useNavigate();
  const { data: sessionData } = useSession();
  const user = sessionData?.data;
  const canManage = Boolean(user?.permissions?.some((permission) => LEAD_PERMISSIONS.includes(permission)));
  const canPropose = Boolean(user?.permissions?.includes("event.propose"));
  const { data: publishedData, isPending, isError, refetch } = useEvents();
  const { data: proposalData } = useQuery({
    queryKey: ["events", "calendar-proposals"],
    enabled: canManage,
    queryFn: async ({ signal }) => {
      const responses = await Promise.all(PROPOSAL_STATUSES.map((status) => getJson(`/events?status=${status}&limit=100`, { signal })));
      return responses.flatMap((response) => response.data || []);
    },
    staleTime: 20_000,
  });
  const [selected, setSelected] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("skyline.savedEvents") || "[]"); }
    catch { return []; }
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const published = publishedData?.data || [];
  const proposals = canManage ? proposalData || [] : [];
  const allEvents = useMemo(() => [...published, ...proposals], [published, proposals]);
  const categories = useMemo(() => ["ALL", ...new Set(allEvents.map((event) => (event.category || "GENERAL").toUpperCase()))], [allEvents]);
  const visibleEvents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return allEvents.filter((event) =>
      (!search || [event.title, event.description, event.venue].some((value) => String(value || "").toLowerCase().includes(search))) &&
      (category === "ALL" || (event.category || "GENERAL").toUpperCase() === category),
    );
  }, [allEvents, category, query]);
  const fullCalendarEvents = useMemo(() => visibleEvents.map((event) => ({
    id: event.id,
    title: event.title,
    // Use an IST date-only calendar marker so overnight and multi-day events
    // occupy exactly one month cell. The drawer retains the real time range.
    start: eventDate(event)?.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    allDay: true,
    classNames: [event.status !== "PUBLISHED" ? "calendar-event-proposed" : CATEGORY_COLORS[(event.category || "").toUpperCase()] || "calendar-event-default"],
    extendedProps: { item: event },
  })), [visibleEvents]);
  const upcoming = useMemo(() => published.filter((event) => eventDate(event)?.getTime() >= Date.now()).slice(0, 4), [published]);
  const selectedDayEvents = useMemo(() => visibleEvents.filter((event) => sameDay(eventDate(event), selectedDay)), [selectedDay, visibleEvents]);
  const pending = proposals.filter((event) => event.status === "PENDING_APPROVAL");

  useEffect(() => localStorage.setItem("skyline.savedEvents", JSON.stringify(savedIds)), [savedIds]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("event")) return;
    params.delete("event");
    navigate({ pathname: "/calendar", search: params.toString() }, { replace: true });
  }, [navigate]);

  function openEvent(event) {
    setSelected(event);
  }
  function closeEvent() {
    setSelected(null);
  }

  function move(direction) {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (direction === "next") api.next();
    else api.prev();
  }
  function toggleSaved(id) {
    setSavedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }
  function shareEvent(event) {
    setSelected(event);
    setIsShareModalOpen(true);
  }

  if (isError) {
    return <div className="page-container py-16"><ContentState error title="We couldn't load the calendar." description="Try again to see what is happening around Skyline." action={() => refetch()} /></div>;
  }

  return (
    <div className="calendar-page page-container py-8 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" /> Campus calendar</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Everything happening, <span className="text-primary">in one place.</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Published events for everyone{canManage ? ", with proposals layered in for the leadership team" : " — clear, current, and easy to save"}.</p>
        </div>
        {canPropose && <Button asChild className="h-11 shrink-0"><Link to="/manage/events/new"><Plus /> Propose event</Link></Button>}
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label="Events calendar">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Monthly schedule</p>
                <h2 className="mt-0.5 truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm" aria-label="Change month">
                <Button variant="ghost" size="icon" onClick={() => move("prev")} aria-label="Previous month"><ArrowLeft /></Button>
                <span className="h-5 w-px bg-border" aria-hidden="true" />
                <Button variant="ghost" size="icon" onClick={() => move("next")} aria-label="Next month"><ArrowRight /></Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, description, or venue…" className="pl-9" aria-label="Search calendar" />
              </div>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm" aria-label="Filter event category">
                {categories.map((value) => <option key={value} value={value}>{value === "ALL" ? "All categories" : categoryLabel(value)}</option>)}
              </select>
            </div>
            {canManage && <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Published</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-dashed border-amber-600 bg-warning-soft" /> Proposed</span></div>}
          </div>
          <div className={cn("calendar-shell p-3 sm:p-5", isPending && "animate-pulse opacity-60")}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={fullCalendarEvents}
              eventContent={(info) => <CalendarEvent event={info.event} />}
              eventClick={(info) => { openEvent(info.event.extendedProps.item); setSelectedDay(info.event.start); }}
              dateClick={(info) => {
                setSelectedDay(info.date);
                if (canManage && info.jsEvent.detail === 2) navigate(`/manage/events/new?date=${info.dateStr}`);
              }}
              datesSet={(info) => {
                setTitle(info.view.title);
                setSelectedDay((current) => current >= info.view.currentStart && current < info.view.currentEnd ? current : info.view.currentStart);
              }}
              dayMaxEvents={3}
              nowIndicator
              height="auto"
              firstDay={1}
              eventDisplay="block"
              buttonText={{ today: "Today" }}
              noEventsContent="No events in this period"
            />
          </div>
        </section>

        <aside className="space-y-5" aria-label="Calendar summary">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Selected day</p><h2 className="mt-1 font-display text-xl font-semibold">{DATE_FORMAT.format(selectedDay)}</h2></div><CalendarDays className="size-5 text-primary" /></div>
            <div className="mt-4 space-y-1">
              {selectedDayEvents.length ? selectedDayEvents.map((event) => <MiniEvent key={event.id} event={event} onSelect={openEvent} saved={savedIds.includes(event.id)} onSave={!canManage ? toggleSaved : null} />) : <p className="rounded-xl bg-secondary/50 px-4 py-5 text-center text-sm text-muted-foreground">A clear day. Select another date or explore what is coming next.</p>}
            </div>
          </section>

          {canManage && pending.length > 0 && (
            <section className="rounded-2xl border border-warning/30 bg-warning-soft/70 p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-warning">Review queue</p><h2 className="mt-1 font-display text-xl font-semibold">{pending.length} pending</h2></div><Users className="size-5 text-warning" /></div>
              <div className="mt-4 space-y-2">{pending.slice(0, 3).map((event) => <Link key={event.id} to={`/manage/events/${event.id}/review`} className="block rounded-xl border border-warning/30 bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-sm"><span className="block truncate text-sm font-semibold">{event.title}</span><span className="mt-1 block text-xs text-muted-foreground">{eventRange(event)}</span></Link>)}</div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Coming next</p><h2 className="mt-1 font-display text-xl font-semibold">On the horizon</h2></div>
            <div className="mt-4 space-y-1">{upcoming.length ? upcoming.map((event) => <MiniEvent key={event.id} event={event} onSelect={openEvent} saved={savedIds.includes(event.id)} onSave={!canManage ? toggleSaved : null} />) : <p className="text-sm text-muted-foreground">No upcoming events have been published yet.</p>}</div>
            <Button asChild variant="ghost" className="mt-3 w-full text-primary"><Link to="/events">Browse event cards <ExternalLink /></Link></Button>
          </section>
        </aside>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && closeEvent()}>
        <SheetContent className="w-[min(92vw,480px)] overflow-y-auto sm:max-w-[480px]">
          {selected && <>
            <SheetHeader className="border-b border-border px-6 pb-5 pt-8">
              {getEventCover(selected) && (
                <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl border border-border bg-muted">
                  <img
                    src={getEventCover(selected)}
                    alt={selected.title}
                    className="size-full object-cover"
                  />
                </div>
              )}
              <div className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={selected.status} /><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{categoryLabel(selected.category)}</span></div>
              <SheetTitle className="pr-8 font-display text-3xl leading-tight">{selected.title}</SheetTitle>
              <SheetDescription className="leading-6">{selected.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-6 py-5">
              {countdown(selected) && <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"><Sparkles className="size-4" />{countdown(selected)}</div>}
              <div className="space-y-4 text-sm">
                <div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Date and time</p><p className="mt-1 text-muted-foreground">{eventRange(selected)}</p></div></div>
                <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Venue</p><p className="mt-1 text-muted-foreground">{selected.venue || "Venue to be announced"}</p></div></div>
                {selected.proposedBy?.name && <div className="flex gap-3"><Users className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Organized by</p><p className="mt-1 text-muted-foreground">{selected.proposedBy.name}</p></div></div>}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-5">
                <Button variant="outline" onClick={() => downloadIcs(selected)}><Download /> Add to calendar</Button>
                <Button variant="outline" onClick={() => shareEvent(selected)}><Share2 /> Share</Button>
                {!canManage && <Button variant={savedIds.includes(selected.id) ? "secondary" : "outline"} className="col-span-2" onClick={() => toggleSaved(selected.id)}><Bookmark className={cn(savedIds.includes(selected.id) && "fill-current")} />{savedIds.includes(selected.id) ? "Saved" : "Save event"}</Button>}
              </div>
              <Button asChild className="w-full"><Link to={selected.status === "PENDING_APPROVAL" && canManage ? `/manage/events/${selected.id}/review` : `/events/${selected.id}`}>{selected.status === "PENDING_APPROVAL" && canManage ? "Review proposal" : "View full event"}<ExternalLink /></Link></Button>
              {selected.status === "PUBLISHED" && <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="size-3.5 text-success" /> Published and visible on the student calendar</p>}
            </div>
          </>}
        </SheetContent>
      </Sheet>

      {selected && (
        <SocialShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          shareData={{
            type: "event",
            title: selected.title,
            description: selected.description,
            date: selected.startAt || selected.startDate,
            venue: selected.venue,
            organizer: selected.proposedBy?.name || "Skyline LDCE",
            imageUrl: getEventCover(selected) || null,
            url: `${window.location.origin}/events/${selected.id}`,
          }}
        />
      )}
    </div>
  );
}
