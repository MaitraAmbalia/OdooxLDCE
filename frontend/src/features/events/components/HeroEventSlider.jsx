import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { EventArtwork } from "./EventCard";
import { categoryLabel, formatEventDate } from "../lib/events";
import { cn } from "@/lib/utils";

export function HeroEventSlider({ events = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const autoPlayRef = useRef(null);

  const total = events.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play interval with pause on hover/focus
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [total, isPaused, nextSlide]);

  // Handle touch swipes on mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="relative flex min-h-96 flex-col justify-between overflow-hidden rounded-2xl bg-secondary p-8 text-primary">
        <div className="poster-orbit" aria-hidden="true" />
        <span className="relative text-sm font-medium">A place to belong.</span>
        <div className="relative">
          <Users className="mb-6 size-12" strokeWidth={1} aria-hidden="true" />
          <p className="max-w-xs font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Your next chapter starts here.
          </p>
          <p className="mt-5 max-w-xs text-sm leading-6">
            Discover the people and possibilities beyond your everyday routine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group/slider relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 transition-shadow hover:shadow-2xl hover:shadow-primary/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Upcoming campus events showcase"
    >
      {/* Horizontal Sliding Track */}
      <div
        className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            className="w-full shrink-0 min-w-full"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}: ${event.title}`}
          >
            <Link
              to={`/events/${event.id}`}
              className="group/card block focus-visible:outline-none"
            >
              {/* Event Artwork */}
              <div className="relative overflow-hidden">
                <EventArtwork
                  event={event}
                  className="home-hero-art transition-transform duration-700 ease-out group-hover/card:scale-[1.02]"
                  priority={index === 0}
                />
              </div>

              {/* Event Content Details */}
              <div className="p-6 sm:p-7">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-primary">
                      {index === 0 ? "Coming up next" : "Featured event"}
                    </span>
                    <span className="text-muted-foreground">
                      {categoryLabel(event.category)}
                    </span>
                  </div>

                  {/* Counter badge */}
                  {total > 1 && (
                    <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {index + 1} / {total}
                    </span>
                  )}
                </div>

                <h2 className="line-clamp-2 font-display text-2xl font-semibold tracking-tight transition-colors group-hover/card:text-primary">
                  {event.title}
                </h2>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    {formatEventDate(event, {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="line-clamp-1">{event.venue || "Venue to be announced"}</span>
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary">
                  <span>Take a closer look</span>
                  <ArrowUpRight className="size-5 transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" aria-hidden="true" />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Chevrons (only if multiple events) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-3 top-36 sm:top-40 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-background active:scale-95 sm:opacity-0 sm:group-hover/slider:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-3 top-36 sm:top-40 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-background active:scale-95 sm:opacity-0 sm:group-hover/slider:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Indicator Dots Bar */}
          <div className="absolute bottom-4 left-6 sm:left-7 flex items-center gap-1.5 pointer-events-auto">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  currentIndex === i
                    ? "w-6 bg-primary"
                    : "w-2 bg-primary/25 hover:bg-primary/50"
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={currentIndex === i ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
