import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentState } from "@/components/common/ContentState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEvents } from "@/features/events/hooks/useEvents";
import {
  EventArtwork,
  EventCard,
  EventCardSkeleton,
} from "@/features/events/components/EventCard";
import {
  categoryLabel,
  filterEvents,
  formatEventDate,
} from "@/features/events/lib/events";

const pathways = [
  {
    icon: Ticket,
    title: "Make plans worth keeping.",
    description:
      "Find your next workshop, campus celebration, or something completely new.",
    to: "/events",
    action: "Find an event",
    tone: "bg-secondary text-primary",
  },
  {
    icon: ShoppingBag,
    title: "Wear a little campus pride.",
    description:
      "Explore official Skyline merchandise and find something that feels like you.",
    to: "/shop",
    action: "Explore the shop",
    tone: "bg-[#e4eee8] text-[#345d4a]",
  },
  {
    icon: Users,
    title: "Help shape what comes next.",
    description:
      "Discover leadership opportunities and make your mark on the community.",
    to: "/selection",
    action: "Explore opportunities",
    tone: "bg-[#f6e8df] text-[#86533d]",
  },
];

export default function Home() {
  usePageTitle("Your campus, connected");
  const { data, isPending, isError, refetch } = useEvents();
  const upcoming = filterEvents(data?.data || []);
  const featured = upcoming[0];
  return (
    <>
      <section
        className="page-container grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-20"
        aria-labelledby="home-title"
      >
        <div>
          <p className="mb-6 inline-flex items-center gap-2.5 text-sm font-medium text-primary">
            <span className="size-2 rounded-full bg-primary" />
            Your campus, connected
          </p>
          <h1
            id="home-title"
            className="max-w-xl font-display text-[clamp(2.8rem,5.4vw,4.8rem)] font-semibold leading-[1.04] tracking-[-0.055em]"
          >
            Good things
            <br />
            happen <span className="text-primary">together.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            The events you look forward to. The people you find your place with.
            Make more of campus life with Skyline.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/events">
                Explore events <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 bg-card px-6"
            >
              <Link to="/join">Become a member</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card">
              <Users className="size-4 text-primary" aria-hidden="true" />
            </span>
            Find your people. Make your memories.
          </div>
        </div>
        <div className="relative min-w-0">
          {isPending ? (
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              aria-label="Loading featured event"
            >
              <Skeleton className="home-hero-art rounded-none" />
              <div className="space-y-3 p-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : featured ? (
            <Link
              to={`/events/${featured.id}`}
              className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5"
            >
              <EventArtwork
                event={featured}
                className="home-hero-art"
                priority
              />
              <div className="p-6 sm:p-7">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-primary">
                    Coming up next
                  </span>
                  <span className="text-muted-foreground">
                    {categoryLabel(featured.category)}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight group-hover:text-primary">
                  {featured.title}
                </h2>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    {formatEventDate(featured, {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    {featured.venue || "Venue to be announced"}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary">
                  Take a closer look
                  <ArrowUpRight className="size-5" aria-hidden="true" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative flex min-h-96 flex-col justify-between overflow-hidden rounded-2xl bg-secondary p-8 text-primary">
              <div className="poster-orbit" aria-hidden="true" />
              <span className="relative text-sm font-medium">
                A place to belong.
              </span>
              <div className="relative">
                <Users
                  className="mb-6 size-12"
                  strokeWidth={1}
                  aria-hidden="true"
                />
                <p className="max-w-xs font-display text-5xl font-semibold leading-[1.05] tracking-tight">
                  Your next chapter starts here.
                </p>
                <p className="mt-5 max-w-xs text-sm leading-6">
                  Discover the people and possibilities beyond your everyday
                  routine.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      <section
        className="border-y border-border bg-card"
        aria-label="Explore campus life"
      >
        <div className="page-container grid gap-8 py-9 md:grid-cols-3 md:gap-10">
          {pathways.map(
            ({ icon: Icon, title, description, to, action, tone }) => (
              <div key={to} className="flex gap-4">
                <span
                  className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold leading-snug">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                  <Link
                    to={to}
                    className="mt-3 inline-flex min-h-8 items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {action}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
      <section
        className="page-container py-14 sm:py-20"
        aria-labelledby="upcoming-title"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">
              Make room in your calendar
            </p>
            <h2
              id="upcoming-title"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              See you around campus.
            </h2>
            <p className="mt-3 text-muted-foreground">
              A few good reasons to step out and show up.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11 bg-card">
            <Link to="/events">
              All events <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {isPending ? (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading upcoming events"
          >
            {[0, 1, 2].map((id) => (
              <EventCardSkeleton key={id} />
            ))}
          </div>
        ) : isError ? (
          <ContentState
            error
            title="Events are taking a little longer."
            description="We couldn't load the calendar. Try again in a moment."
            action={() => refetch()}
          />
        ) : upcoming.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <ContentState
            title="The next chapter is on its way."
            description="There are no upcoming events right now. Check the event calendar for past events and future announcements."
          />
        )}
      </section>
      <section className="page-container pb-14 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-[#272747] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-medium text-[#c6c3f3]">
              Make it your community
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              More than showing up. Belonging.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#d2d2e2]">
              Explore Skyline membership, find the plan that fits, and keep your
              digital membership card close at hand.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-7 h-12 bg-white px-6 text-[#272747] hover:bg-[#eeedf7] lg:mt-0"
          >
            <Link to="/join">
              Explore membership <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
