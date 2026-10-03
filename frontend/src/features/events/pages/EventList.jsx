import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ArrowUpRight,
  CalendarDays,
  Code2,
  Frame,
  GraduationCap,
  LayoutGrid,
  Mic,
  PartyPopper,
  Sparkles,
  Swords,
  Trophy,
  Wrench,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentState } from "@/components/common/ContentState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";
import { useEvents } from "../hooks/useEvents";
import { EventCard, EventCardSkeleton } from "../components/EventCard";
import { categoryLabel, filterEvents } from "../lib/events";

const sortLabels = {
  soonest: "Soonest first",
  latest: "Latest first",
  title: "Name: A–Z",
};
const periodLabels = {
  upcoming: "Upcoming",
  all: "All dates",
  past: "Past events",
};

// Icon per category code; anything unknown falls back to Sparkles.
const CATEGORY_ICON = { ALL: LayoutGrid, WORKSHOP: Wrench, HACKATHON: Code2, CONFERENCE: Mic, COMPETITION: Swords, EXHIBITION: Frame, GALA: PartyPopper, SOCIAL: PartyPopper, SPORTS: Trophy, ACADEMIC: GraduationCap };

export default function EventList() {
  usePageTitle("Explore events");
  const { data, isPending, isError, refetch } = useEvents();
  const [params, setParams] = useUrlFilters();
  const events = data?.data || [];
  const search = params.get("q") || "";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);

  const category = params.get("category") || "ALL";
  const period = Object.hasOwn(periodLabels, params.get("period"))
    ? params.get("period")
    : "upcoming";
  const sort = Object.hasOwn(sortLabels, params.get("sort"))
    ? params.get("sort")
    : "soonest";
  const categories = [
    "ALL",
    ...new Set(
      events.map((event) => (event.category || "GENERAL").toUpperCase()),
    ),
  ];
  const filtered = filterEvents(events, { search, category, period, sort });
  // Counts reflect the current search and period, so a chip never promises events that aren't shown.
  const countBy = filterEvents(events, { search, category: "ALL", period, sort }).reduce(
    (acc, e) => ({ ...acc, ALL: acc.ALL + 1, [(e.category || "GENERAL").toUpperCase()]: (acc[(e.category || "GENERAL").toUpperCase()] ?? 0) + 1 }),
    { ALL: 0 },
  );
  const hasFilters = Boolean(
    search || category !== "ALL" || period !== "upcoming" || sort !== "soonest",
  );

  function updateFilter(key, value, replace = false) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (
          !value ||
          (key === "category" && value === "ALL") ||
          (key === "period" && value === "upcoming") ||
          (key === "sort" && value === "soonest")
        )
          next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace, preventScrollReset: true },
    );
  }

  // Update URL filter when debounced search value settles
  useEffect(() => {
    updateFilter("q", debouncedSearch, true);
  }, [debouncedSearch]);

  // Keep searchInput in sync if URL params change externally
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  function clearFilters() {
    setSearchInput("");
    setParams({}, { preventScrollReset: true });
  }

  return (
    <>
      <section className="border-b border-border bg-[#f0eff8]">
        <div className="page-container flex items-center justify-between gap-8 py-12 sm:py-16">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
              <CalendarDays className="size-4" aria-hidden="true" />
              The campus calendar
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Find your next <span className="text-primary">good plan.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Big nights, bright ideas, and new faces. Discover what's happening
              in your community.
            </p>
          </div>
          <div
            className="hidden shrink-0 rounded-full border border-primary/20 p-6 text-primary/60 md:block"
            aria-hidden="true"
          >
            <CalendarDays className="size-14" strokeWidth={1} />
          </div>
        </div>
      </section>
      <section
        className="page-container py-8 sm:py-10"
        aria-label="Event discovery"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="event-search" className="sr-only">
              Search events
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="event-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search events, interests, or venues…"
              className="h-11 bg-card pl-10 pr-10 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-11"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  updateFilter("q", "", true);
                }}
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 flex-1 bg-card sm:min-w-36"
                >
                  <CalendarDays aria-hidden="true" />
                  {periodLabels[period]}
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={period}
                  onValueChange={(value) => updateFilter("period", value)}
                >
                  {Object.entries(periodLabels).map(([value, label]) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 flex-1 bg-card sm:min-w-40"
                >
                  <SlidersHorizontal aria-hidden="true" />
                  {sortLabels[sort]}
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => updateFilter("sort", value)}
                >
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div
          role="group"
          aria-label="Filter by category"
          className="mt-5 flex flex-wrap gap-2"
        >
          {categories.map((value) => {
            const Icon = CATEGORY_ICON[value] ?? Sparkles;
            return (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={category === value}
              onClick={() => updateFilter("category", value)}
              className={cn(
                "h-10 gap-1.5 rounded-full border px-3.5 text-sm",
                category === value
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {value === "ALL" ? "All categories" : categoryLabel(value)}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", category === value ? "bg-white/20" : "bg-muted")}>{countBy[value] ?? 0}</span>
            </Button>
            );
          })}
        </div>
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-4">
          <p
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {isPending ? (
              "Finding your next plan…"
            ) : isError ? (
              "Calendar unavailable"
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                {period === "upcoming" ? "upcoming " : ""}
                {filtered.length === 1 ? "event" : "events"}
                {search.trim() ? ` matching “${search.trim()}”` : ""}
              </>
            )}
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-primary"
              onClick={clearFilters}
            >
              <X aria-hidden="true" />
              Reset filters
            </Button>
          )}
        </div>
        {isPending ? (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading events"
            role="status"
          >
            {[0, 1, 2].map((id) => (
              <EventCardSkeleton key={id} />
            ))}
          </div>
        ) : isError ? (
          <ContentState
            error
            title="We couldn't load the calendar."
            description="Your plans can wait a moment. Try again to see what's happening."
            action={() => refetch()}
          />
        ) : filtered.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <ContentState
            title={
              hasFilters
                ? "No matches just yet."
                : "A little quiet on the calendar."
            }
            description={
              hasFilters
                ? "Try another search or reset the filters to explore upcoming events."
                : "New events will appear here when they are announced. You can also explore past events."
            }
            action={
              hasFilters ? clearFilters : () => updateFilter("period", "all")
            }
            actionLabel={hasFilters ? "Reset filters" : "Explore all dates"}
          />
        )}
        <div className="mt-12 flex flex-col justify-between gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-semibold">
              A little more from your campus life.
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Explore membership plans and the benefits that come with being
              part of Skyline.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11 shrink-0">
            <Link to="/join">
              Explore membership <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
