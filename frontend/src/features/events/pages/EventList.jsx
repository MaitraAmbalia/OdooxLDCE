import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, MapPin, Clock, ArrowRight, Sparkles, 
  Users, Tag, ShieldCheck, Flame, Filter 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";

export default function EventList() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: async () => {
      const res = await fetch("/api/v1/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    }
  });

  const events = eventsData?.data || [];
  const categories = ["ALL", "GALA", "TECHNICAL", "WORKSHOP", "SOCIAL"];

  const filteredEvents = selectedCategory === "ALL" 
    ? events 
    : events.filter(e => (e.category || "GENERAL").toUpperCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
          <div>
            <Badge variant="gold" className="text-xs uppercase font-extrabold tracking-wider px-3 py-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-950" /> Campus Calendar 2026
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
              Campus Events & Galas
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              From flagship annual Galas to deep-dive AI hackathons and leadership symposiums. Verified members receive up to 40% discount.
            </p>
          </div>

          <Link to="/join">
            <Button variant="outline" size="sm" className="bg-white border-slate-300 text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 mr-1.5" />
              Get Member Discount Pass
            </Button>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 py-6 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white font-bold shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 font-medium">
            Failed to load events. Please refresh.
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800">
              {selectedCategory === "ALL" ? "No upcoming events yet" : "No events in this category"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Check back soon for new semester schedules.</p>
            {selectedCategory !== "ALL" && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelectedCategory("ALL")}>Show all events</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
            {filteredEvents.map(event => {
              const eventDate = new Date(event.startDate || event.startAt || Date.now());
              const types = event.ticketTypes || [];
              const prices = types.map(t => Number(t.pricePaise));
              const minPrice = prices.length ? Math.min(...prices) : null;
              const hasMemberPrice = types.some(t => t.audience === "MEMBER");
              const quota = types.reduce((n, t) => n + (t.quota || 0), 0);
              const sold = types.reduce((n, t) => n + (t.sold || 0), 0);
              const soldOut = quota > 0 && sold >= quota;
              const fillingFast = !soldOut && quota > 0 && sold / quota >= 0.7;

              return (
                <Link 
                  key={event.id} 
                  to={`/events/${event.id}`}
                  className="group flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Event Cover Image or Dynamic Gradient Banner */}
                    <div className="relative h-52 bg-slate-900 overflow-hidden">
                      {event.coverImageUrl ? (
                        <img 
                          src={event.coverImageUrl} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6 text-center">
                          <span className="font-display font-black text-2xl text-white/30 tracking-widest uppercase">
                            {event.category || "SKYLINE"}
                          </span>
                        </div>
                      )}

                      {/* Scarcity / Highlight Badges on Cover */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {fillingFast && (
                          <Badge variant="gold" className="text-[11px] font-bold uppercase tracking-wider py-0.5 shadow-sm">
                            <Flame className="w-3 h-3 text-amber-950 inline fill-amber-950" aria-hidden="true" />
                            Filling Fast
                          </Badge>
                        )}
                        {soldOut && (
                          <Badge variant="dark" className="text-[11px] font-bold uppercase tracking-wider py-0.5">Sold Out</Badge>
                        )}
                        <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-wider py-0.5 bg-slate-900/80 text-white backdrop-blur-sm border-slate-700">
                          {event.category || "General"}
                        </Badge>
                      </div>

                      {/* Floating Date Square */}
                      <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 backdrop-blur-md px-3 py-1.5 text-center shadow-md border border-white/40">
                        <div className="text-[11px] font-mono uppercase font-bold text-blue-700">
                          {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
                        </div>
                        <div className="text-xl font-display font-black text-slate-900 leading-none">
                          {eventDate.getDate()}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-display font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {event.title}
                      </h3>

                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {event.description || "Join the LDCE student body for an unforgettable evening of keynote presentations, cultural acts, and networking."}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} • {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{event.venue || "LDCE Auditorium"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Pricing Anchor & Action */}
                  <div className="p-6 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-slate-500">Tickets from</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-display font-black text-slate-900">
                          {minPrice === null ? "TBA" : minPrice === 0 ? "Free" : formatINR(minPrice, true)}
                        </span>
                        {hasMemberPrice && (
                          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Member pricing
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      {soldOut ? "View" : "Reserve"} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
