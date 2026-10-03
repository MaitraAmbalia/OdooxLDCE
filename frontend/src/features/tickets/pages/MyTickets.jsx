import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Ticket as TicketIcon, Calendar, MapPin, QrCode,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function MyTickets() {
  usePageTitle("My tickets");
  const { data: ticketsData, isPending, isError, refetch } = useQuery({
    queryKey: ['tickets', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/tickets/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    }
  });

  const tickets = ticketsData?.data || [];
  const activeTickets = tickets.filter(t => t.status !== "CHECKED_IN" && t.status !== "CANCELLED");
  const pastTickets = tickets.filter(t => t.status === "CHECKED_IN" || t.status === "CANCELLED");

  if (isPending) {
    return (
      <div className="page-container max-w-4xl py-12" role="status" aria-label="Loading tickets">
        <Skeleton className="h-8 w-44 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Ready when you are</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            My event passes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open a pass for its entrance QR code and check-in details.
          </p>
        </div>

        <Link to="/events">
          <Button>
            <Calendar aria-hidden="true" /> Browse events
          </Button>
        </Link>
      </div>

      {isError ? (
        <ContentState error title="Your tickets aren’t available right now." description="We couldn’t load your passes. Try again in a moment." action={refetch} />
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
          <TabsTrigger value="active" className="gap-2">
            Active Passes
            <Badge variant="primary" className="py-0 px-1.5 text-[10px]">
              {activeTickets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            Past Events
            <Badge variant="secondary" className="py-0 px-1.5 text-[10px]">
              {pastTickets.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ACTIVE PASSES */}
        <TabsContent value="active">
          {activeTickets.length === 0 ? (
            <ContentState title="No active tickets right now." description="When you reserve a place at an event, your entrance pass will appear here." actionLabel="Explore events" action={() => window.location.assign("/events")} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeTickets.map(ticket => {
                const event = ticket.event || {};
                const eventDate = event.startDate ? new Date(event.startDate) : new Date();

                return (
                  <Link 
                    key={ticket.id} 
                    to={`/me/tickets/${ticket.id}`}
                    className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                  >
                    {/* Perforation left bar */}
                    <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-primary"></div>

                    <div className="p-5 pl-6 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {ticket.ticketType?.name || "General Admission"}
                          </span>
                          <Badge variant="success" className="text-[10px] uppercase font-bold py-0.5">
                            Ready to Scan
                          </Badge>
                        </div>

                        <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                          {event.title || "Skyline Event"}
                        </h3>

                        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5" />
                            <span>
                              {eventDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            <span className="truncate">{event.venue || "LDCE Auditorium"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
                        <span className="text-[11px] text-muted-foreground">{ticket.status === "CHECKED_IN" ? "Checked in" : "Ready to scan"}</span>
                        <span className="flex items-center gap-1 font-medium text-primary transition-transform group-hover:translate-x-0.5">
                          <QrCode className="size-4" /> Open pass &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PAST PASSES */}
        <TabsContent value="past">
          {pastTickets.length === 0 ? (
            <ContentState title="No past events yet." description="Your attended and cancelled event history will appear here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
              {pastTickets.map(ticket => (
                <div key={ticket.id} className="rounded-xl border border-border bg-card p-4 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{ticket.event?.title || "Past Event"}</h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(ticket.event?.startDate || Date.now()).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <Badge variant="secondary">Attended</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
