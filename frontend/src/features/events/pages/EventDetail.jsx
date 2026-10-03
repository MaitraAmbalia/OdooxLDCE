import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch Event details
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      // API endpoint: GET /events/:id
      const res = await fetch(`/api/v1/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    }
  });

  // Fetch Ticket Types
  const { data: ticketTypesData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['events', id, 'ticket-types'],
    queryFn: async () => {
      // API endpoint: GET /events/:id/ticket-types
      const res = await fetch(`/api/v1/events/${id}/ticket-types`);
      if (!res.ok) throw new Error("Failed to fetch ticket types");
      return res.json();
    }
  });

  const event = eventData?.data;
  const ticketTypes = ticketTypesData?.data || [];

  const handleBuy = async () => {
    if (!selectedTicket) return;
    
    // API endpoint: POST /tickets/checkout or /events/:id/checkout
    console.log("Buying ticket:", selectedTicket.id);
    navigate(`/checkout/status/mock-ticket-${selectedTicket.id}`);
  };

  if (eventLoading || ticketsLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center">Loading event...</div>;
  }

  if (!event) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-[var(--color-stop)]">Event not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="h-64 sm:h-96 w-full bg-gray-200 rounded-[10px] overflow-hidden mb-8">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">No Cover Image</div>
            )}
          </div>
          
          <h1 className="text-4xl font-display font-extrabold text-[var(--color-ink)] mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-4 mb-8 text-sm text-[var(--color-ink)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--color-muted)]">Date:</span>
              {new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--color-muted)]">Venue:</span>
              {event.venue}
            </div>
          </div>
          
          <div className="prose prose-sm sm:prose-base max-w-none text-[var(--color-ink)] mb-12">
            <p className="whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>

        {/* Sticky Buy Panel */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="sticky top-24 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-md">
            <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-6">Select Tickets</h3>
            
            <div className="space-y-4 mb-6">
              {ticketTypes.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-[6px] border cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? "border-[var(--color-dusk)] bg-[var(--color-paper)] ring-1 ring-[var(--color-dusk)]"
                      : "border-[var(--color-line)] hover:border-[var(--color-muted)]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-[var(--color-ink)]">{ticket.name}</h4>
                      {ticket.description && <p className="text-xs text-[var(--color-muted)] mt-1">{ticket.description}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-display font-bold tracking-tight tabular-nums">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(ticket.pricePaise / 100)}
                      </span>
                    </div>
                  </div>
                  {/* Honest pricing note for non-members, if applicable */}
                  {ticket.memberOnly && (
                    <div className="mt-2 text-xs text-[var(--color-lamp)] font-medium">
                      Requires active membership
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleBuy}
              disabled={!selectedTicket}
              className="w-full py-3 px-4 border border-transparent rounded-[6px] shadow-sm text-sm font-medium text-white bg-[var(--color-dusk)] hover:bg-opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedTicket ? `Reserve & Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(selectedTicket.pricePaise / 100)}` : "Select a ticket"}
            </button>
            <p className="mt-4 text-xs text-center text-[var(--color-muted)]">
              All prices include applicable taxes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
