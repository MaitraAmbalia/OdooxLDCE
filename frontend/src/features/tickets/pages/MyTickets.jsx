import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Ticket as TicketIcon, Calendar, MapPin, ArrowRight, 
  Sparkles, QrCode, Clock, ShieldCheck 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";

export default function MyTickets() {
  const { data: ticketsData, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-44 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            My Event Passes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tap any pass to reveal your entrance QR code and door instructions.
          </p>
        </div>

        <Link to="/events">
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Calendar className="w-3.5 h-3.5 mr-1" /> Browse Upcoming Events
          </Button>
        </Link>
      </div>

      {/* Tabs */}
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
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <TicketIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">
                No active tickets right now
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                You don't have any upcoming event passes. Grab early bird tickets for the Skyline Annual Gala and workshops before capacity fills!
              </p>
              <div className="mt-6">
                <Link to="/events">
                  <Button variant="gold" size="md">
                    Explore Campus Events &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeTickets.map(ticket => {
                const event = ticket.event || {};
                const eventDate = event.startDate ? new Date(event.startDate) : new Date();

                return (
                  <Link 
                    key={ticket.id} 
                    to={`/me/tickets/${ticket.id}`}
                    className="group block relative rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all duration-300 overflow-hidden"
                  >
                    {/* Perforation left bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-600 to-indigo-600"></div>

                    <div className="p-5 pl-6 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                            {ticket.ticketType?.name || "General Admission"}
                          </span>
                          <Badge variant="success" className="text-[10px] uppercase font-bold py-0.5">
                            Ready to Scan
                          </Badge>
                        </div>

                        <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {event.title || "Skyline Event"}
                        </h3>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {eventDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{event.venue || "LDCE Auditorium"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-slate-400">
                          ID: {ticket.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <QrCode className="w-4 h-4" /> Open Pass &rarr;
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
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
              No attended past events found in your history.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
              {pastTickets.map(ticket => (
                <div key={ticket.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{ticket.event?.title || "Past Event"}</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">
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
    </div>
  );
}
