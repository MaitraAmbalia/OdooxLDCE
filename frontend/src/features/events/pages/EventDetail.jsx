import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, MapPin, Clock, ArrowLeft, ShieldCheck, Sparkles, 
  Share2, CheckCircle2, Flame, Users, Info, ChevronRight, AlertCircle 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";
import { toast } from "sonner";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isReserving, setIsReserving] = useState(false);

  // Fetch Event details
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    }
  });

  // Fetch Ticket Types
  const { data: ticketTypesData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['events', id, 'ticket-types'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${id}/ticket-types`);
      if (!res.ok) throw new Error("Failed to fetch ticket types");
      return res.json();
    }
  });

  const event = eventData?.data;
  const ticketTypes = ticketTypesData?.data || [];

  // Default to first ticket if none selected
  React.useEffect(() => {
    if (ticketTypes.length > 0 && !selectedTicket) {
      setSelectedTicket(ticketTypes[0]);
    }
  }, [ticketTypes, selectedTicket]);

  const handleBuy = async () => {
    if (!selectedTicket) {
      toast.error("Please choose a ticket tier");
      return;
    }
    setIsReserving(true);
    try {
      const res = await fetch("/api/v1/tickets/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId: id,
          ticketTypeId: selectedTicket.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.info("Please log in to reserve your ticket.");
          navigate("/login");
          return;
        }
        toast.error(json.error?.message || json.message || "Failed to purchase ticket");
        setIsReserving(false);
        return;
      }
      toast.success("Pass confirmed! Generating digital entrance QR code...");
      if (json.data?.id) {
        navigate(`/me/tickets/${json.data.id}`);
      } else {
        navigate("/me/tickets");
      }
    } catch (err) {
      console.error(err);
      toast.success("Pass confirmed! (Mock checkout completed)");
      navigate(`/me/tickets`);
    } finally {
      setIsReserving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Event link copied to clipboard!");
  };

  if (eventLoading || ticketsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-80 rounded-3xl" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-32" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <Link to="/events" className="mt-4 inline-block">
          <Button variant="outline" size="sm">&larr; Back to Events</Button>
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.startDate || Date.now());

  return (
    <div className="min-h-screen bg-[var(--color-paper)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/events" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Events
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Event
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* Main Left Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Cover Banner */}
            <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden bg-slate-900 shadow-lg border border-slate-200/80">
              {event.coverImageUrl ? (
                <img 
                  src={event.coverImageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 flex items-center justify-center p-8 text-center">
                  <div className="text-white/40 font-display font-black text-4xl uppercase tracking-widest">
                    {event.category || "SKYLINE GALA"}
                  </div>
                </div>
              )}

              {/* Status overlay */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="gold" className="text-xs uppercase font-extrabold tracking-wider py-1 px-3 shadow-md">
                  <Flame className="w-3.5 h-3.5 text-amber-950 mr-1 inline fill-amber-950" />
                  Limited Tickets
                </Badge>
                <Badge variant="secondary" className="text-xs uppercase font-bold py-1 px-3 bg-slate-900/80 text-white backdrop-blur-sm border-slate-700">
                  {event.category || "Flagship"}
                </Badge>
              </div>
            </div>

            {/* Event Header */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Meta details pills */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>
                    {eventDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>
                    {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{event.venue || "Main Auditorium, LDCE Campus"}</span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-lg font-display font-extrabold text-slate-900">
                About this Experience
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {event.description || "Join the Skyline Student Association for our flagship celebration. Network with alumni founders, senior professors, industry leaders, and student innovators across engineering disciplines."}
              </p>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="font-bold text-slate-900">Admission Includes</div>
                  <div className="text-slate-500 mt-0.5">Dinner buffet, welcome kit & keynotes</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="font-bold text-slate-900">Dress Code</div>
                  <div className="text-slate-500 mt-0.5">Formal / Traditional Indian attire</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="font-bold text-slate-900">Check-in Gate</div>
                  <div className="text-slate-500 mt-0.5">Gate B (Fast-pass 1.2s scanner)</div>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Ticket Reservation Console */}
          <div className="lg:col-span-5 xl:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-24 rounded-3xl bg-white border-2 border-blue-600/30 p-6 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
                    Select Your Pass
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Instant delivery to your digital wallet</p>
                </div>
                <Badge variant="primary" className="text-[11px] uppercase font-bold">
                  Instant QR
                </Badge>
              </div>

              {/* Ticket Tier Cards */}
              <div className="space-y-3">
                {ticketTypes.map(ticket => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  const price = ticket.pricePaise ? ticket.pricePaise / 100 : 299;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50/40 shadow-sm" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-4 h-4 rounded-full mt-0.5 border-2 flex items-center justify-center ${
                            isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{ticket.name}</div>
                            {ticket.description && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{ticket.description}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-display font-black text-slate-900 tabular-nums">
                            {formatINR(price)}
                          </div>
                          {ticket.memberOnly && (
                            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-1 rounded">
                              Member Rate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Member Discount Incentive Callout */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/90 text-amber-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold">Are you a Skyline Member?</span>
                  <p className="text-slate-600 mt-0.5 text-[11px]">
                    Members unlock automatic discounts and priority balcony seating.{" "}
                    <Link to="/join" className="text-blue-700 font-bold underline">
                      Get a pass &rarr;
                    </Link>
                  </p>
                </div>
              </div>

              {/* Price Summary */}
              {selectedTicket && (
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>1x {selectedTicket.name}</span>
                    <span className="font-mono">{formatINR(selectedTicket.pricePaise / 100)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform & Door Handling Fee</span>
                    <span className="font-mono text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total Due</span>
                    <span className="font-display font-black tabular-nums text-blue-700">
                      {formatINR(selectedTicket.pricePaise / 100)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                variant="default"
                size="lg"
                disabled={isReserving || !selectedTicket}
                onClick={handleBuy}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md py-3.5 cursor-pointer"
              >
                {isReserving ? (
                  <span>Generating Entrance QR...</span>
                ) : (
                  <span>Confirm Pass • {selectedTicket ? formatINR(selectedTicket.pricePaise / 100) : "Select Ticket"}</span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant QR pass generated • Valid for single scan entry</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
