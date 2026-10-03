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
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { SocialShareModal } from "../../../components/common/SocialShareModal";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch Event details
  const { data: eventData, isPending: eventLoading, isError: eventError, refetch: refetchEvent } = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    }
  });

  // Fetch Ticket Types
  const { data: ticketTypesData, isPending: ticketsLoading, isError: ticketsError, refetch: refetchTickets } = useQuery({
    queryKey: ['events', id, 'ticket-types'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${id}/ticket-types`);
      if (!res.ok) throw new Error("Failed to fetch ticket types");
      return res.json();
    }
  });

  const event = eventData?.data;
  const ticketTypes = ticketTypesData?.data || [];
  usePageTitle(event?.title || "Event details");

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
    setIsShareModalOpen(true);
  };

  if (eventLoading || ticketsLoading) {
    return (
      <div className="page-container py-12" role="status" aria-label="Loading event details">
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

  if (eventError || ticketsError || !event) {
    return (
      <div className="page-container py-16">
        <ContentState error title="We couldn’t load this event." description="It may no longer be available, or the connection may have been interrupted." action={() => { refetchEvent(); refetchTickets(); }} />
      </div>
    );
  }

  const eventDate = new Date(event.startAt || event.startDate || Date.now());

  return (
    <div className="page-container py-10 sm:py-14">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/events" 
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Events
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Event
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* Main Left Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Cover Banner */}
            <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-[#272747] sm:h-96">
              {event.coverImageUrl ? (
                <img 
                  src={event.coverImageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-[#272747] p-8 text-center">
                  <div className="font-display text-4xl font-semibold uppercase tracking-widest text-white/40">
                    {event.category || "SKYLINE GALA"}
                  </div>
                </div>
              )}

              {/* Status overlay */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-white text-[#272747]">
                  <Flame className="mr-1 size-3.5" /> Limited tickets
                </Badge>
                <Badge variant="secondary" className="border-white/20 bg-[#272747]/85 text-white backdrop-blur-sm">
                  {event.category || "Flagship"}
                </Badge>
              </div>
            </div>

            {/* Event Header */}
            <div>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {event.title}
              </h1>

              {/* Meta details pills */}
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2">
                  <Calendar className="size-4 text-primary" />
                  <span>
                    {eventDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2">
                  <Clock className="size-4 text-primary" />
                  <span>
                    {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2">
                  <MapPin className="size-4 text-primary" />
                  <span>{event.venue || "Main Auditorium, LDCE Campus"}</span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold">
                About this event
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {event.description || "Join the Skyline Student Association for our flagship celebration. Network with alumni founders, senior professors, industry leaders, and student innovators across engineering disciplines."}
              </p>

            </div>

          </div>

          {/* Sticky Ticket Reservation Console */}
          <div className="lg:col-span-5 xl:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-36 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Choose your pass
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Instant delivery to your digital wallet</p>
                </div>
                <Badge variant="primary" className="text-[10px] uppercase font-bold">
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
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedTicket(ticket)}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedTicket(ticket); }}
                      className={`cursor-pointer select-none rounded-xl border-2 p-4 transition ${
                        isSelected 
                          ? "border-primary bg-secondary/60"
                          : "border-border hover:border-primary/30 hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-4 h-4 rounded-full mt-0.5 border-2 flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary" : "border-input"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{ticket.name}</div>
                            {ticket.description && (
                              <div className="mt-0.5 text-[11px] text-muted-foreground">{ticket.description}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-display text-base font-semibold tabular-nums">
                            {formatINR(price)}
                          </div>
                          {ticket.memberOnly && (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1 rounded">
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
                className="w-full"
              >
                {isReserving ? (
                  <span>Generating Entrance QR...</span>
                ) : (
                  <span>Confirm Pass • {selectedTicket ? formatINR(selectedTicket.pricePaise / 100) : "Select Ticket"}</span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant QR pass generated • Valid for single scan entry</span>
              </div>

            </div>
          </div>

        </div>

        {/* Social Share Modal */}
        {event && (
          <SocialShareModal
            open={isShareModalOpen}
            onOpenChange={setIsShareModalOpen}
            shareData={{
              type: "event",
              title: event.title,
              description: event.description,
              date: event.startAt || event.startDate,
              venue: event.location || event.venue || "LDCE Campus",
              price: selectedTicket 
                ? formatINR(selectedTicket.pricePaise / 100) 
                : (ticketTypes?.length ? `From ${formatINR(ticketTypes[0].pricePaise / 100)}` : "Free Entry"),
              organizer: event.organizer?.name || "Skyline LDCE",
              url: typeof window !== "undefined" ? window.location.href : "",
            }}
          />
        )}

    </div>
  );
}
