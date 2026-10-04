import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
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
  EventCard,
  EventCardSkeleton,
} from "@/features/events/components/EventCard";
import { HeroEventSlider } from "@/features/events/components/HeroEventSlider";
import { filterEvents } from "@/features/events/lib/events";

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
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    if (!railRef.current) return;
    const offset = direction === "left" ? -360 : 360;
    railRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

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
          ) : (
            <HeroEventSlider events={upcoming} />
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
          <div className="flex items-center gap-2">
            {upcoming.length > 3 && (
              <div className="flex items-center gap-1.5 mr-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full bg-card shadow-sm hover:bg-secondary"
                  onClick={() => scrollRail("left")}
                  aria-label="Previous events"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full bg-card shadow-sm hover:bg-secondary"
                  onClick={() => scrollRail("right")}
                  aria-label="Next events"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            )}
            <Button asChild variant="outline" className="h-11 bg-card">
              <Link to="/events">
                All events <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
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
          <div
            ref={railRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            tabIndex={0}
            role="region"
            aria-label="Upcoming events carousel"
          >
            {upcoming.map((event) => (
              <div
                key={event.id}
                className="w-[min(85vw,340px)] sm:w-[350px] shrink-0 snap-start transition-transform duration-300 hover:-translate-y-1"
              >
                <EventCard event={event} />
              </div>
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
