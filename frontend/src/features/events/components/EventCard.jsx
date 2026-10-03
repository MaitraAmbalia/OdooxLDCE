import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  eventDate,
  eventPrice,
  formatEventDate,
  isPastEvent,
} from "../lib/events";

const posterStyles = {
  GALA: "poster-indigo",
  TECHNICAL: "poster-blue",
  WORKSHOP: "poster-sage",
  SOCIAL: "poster-peach",
};

export function EventArtwork({ event, className, priority = false }) {
  const [failedSource, setFailedSource] = useState(null);
  const cover = event.coverImageUrl;
  const showImage = cover && failedSource !== cover;
  return (
    <div
      className={cn(
        "event-artwork relative isolate overflow-hidden",
        posterStyles[event.category] || "poster-indigo",
        className,
      )}
    >
      {showImage ? (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading={priority ? "eager" : "lazy"}
          onError={() => setFailedSource(cover)}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col justify-between p-6"
        >
          <div className="flex items-center justify-between text-xs font-medium tracking-widest">
            <span>SKYLINE / CAMPUS LIFE</span>
            <span>↗</span>
          </div>
          <div className="poster-orbit" />
          <p className="relative max-w-[80%] font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-5xl">
            {categoryLabel(event.category)}
            <br />
            <span className="opacity-80">together.</span>
          </p>
        </div>
      )}
      <div className="absolute bottom-4 right-4 min-w-14 rounded-lg border border-white/50 bg-white px-3 py-2 text-center text-foreground shadow-sm">
        {eventDate(event) ? (
          <>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
              {formatEventDate(event, { month: "short" })}
            </span>
            <span className="block font-display text-2xl font-semibold leading-tight">
              {formatEventDate(event, { day: "2-digit" })}
            </span>
          </>
        ) : (
          <span className="text-xs font-medium">Date TBA</span>
        )}
      </div>
    </div>
  );
}

export function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <EventArtwork event={event} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
          <span>{categoryLabel(event.category)}</span>
          {isPastEvent(event) ? (
            <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground">
              Past event
            </span>
          ) : event.capacity > 0 && event.capacity - event.seatsSold <= Math.ceil(event.capacity * 0.2) && (
            // Only when it's genuinely nearly full (last 20%).
            <span className={"ml-auto rounded px-2 py-0.5 " + (event.seatsSold >= event.capacity ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning")}>
              {event.seatsSold >= event.capacity ? "Sold out" : `${event.capacity - event.seatsSold} left`}
            </span>
          )}
        </div>
        <h3 className="font-display text-xl font-semibold leading-snug tracking-tight group-hover:text-primary">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {event.description}
          </p>
        )}
        <div className="mt-auto space-y-2 pt-5 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {eventDate(event)
                ? `${formatEventDate(event, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST`
                : "Date to be announced"}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{event.venue || "Venue to be announced"}</span>
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-sm font-medium">{eventPrice(event)}</span>
          <ArrowUpRight
            className="size-5 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
          <span className="sr-only">View event</span>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-hidden="true"
    >
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-4 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-8 h-8 w-full" />
      </div>
    </div>
  );
}
