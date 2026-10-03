import { ArrowLeft, CalendarDays, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <section className="page-container flex min-h-[62vh] items-center py-16 sm:py-24">
      <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid lg:grid-cols-[1fr_0.72fr]">
          <div className="p-7 sm:p-12 lg:p-16">
            <p className="text-sm font-medium text-primary">404 · Wrong turn</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              This page isn’t on the campus map.
            </h1>
            <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
              The link may be outdated, or the page may have moved. Head home or
              browse what’s happening next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/">
                  <Home aria-hidden="true" /> Home
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/events">
                  <CalendarDays aria-hidden="true" /> Explore events
                </Link>
              </Button>
            </div>
            <Button
              variant="link"
              className="mt-5 h-auto px-0 text-muted-foreground"
              onClick={() => window.history.back()}
            >
              <ArrowLeft aria-hidden="true" /> Go back
            </Button>
          </div>
          <div className="relative hidden min-h-96 overflow-hidden bg-secondary text-primary lg:block">
            <div className="poster-orbit" aria-hidden="true" />
            <span className="absolute bottom-10 left-10 font-display text-8xl font-semibold tracking-[-0.08em] opacity-20">
              404
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
