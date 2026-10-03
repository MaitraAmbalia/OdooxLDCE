import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function MyTickets() {
  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['tickets', 'me'],
    queryFn: async () => {
      // API endpoint: GET /tickets/me
      const res = await fetch("/api/v1/tickets/me");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--color-muted)]">Loading your tickets...</div>;
  }

  const tickets = ticketsData?.data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-8">My Tickets</h1>
      
      {tickets.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-8 text-center">
          <p className="text-[var(--color-ink)] mb-4">You don't have any upcoming tickets.</p>
          <Link to="/events" className="inline-block bg-[var(--color-dusk)] text-white px-6 py-2 rounded-md font-medium hover:bg-opacity-90">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <Link 
              key={ticket.id} 
              to={`/me/tickets/${ticket.id}`}
              className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 justify-between"
            >
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--color-ink)]">{ticket.event?.title || "Event"}</h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  {new Date(ticket.event?.startDate || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                </p>
                <div className="mt-2 text-sm font-medium">
                  Type: {ticket.ticketType?.name || "General Admission"}
                </div>
              </div>
              <div className="flex items-center sm:items-start sm:flex-col justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase rounded ${
                  ticket.status === 'CHECKED_IN' ? 'bg-[var(--color-ok)] text-white' :
                  ticket.status === 'ISSUED' ? 'bg-[var(--color-info)] text-white' :
                  'bg-[var(--color-neutral)] text-white'
                }`}>
                  {ticket.status || "ISSUED"}
                </span>
                <span className="text-[var(--color-dusk)] text-sm font-medium mt-auto sm:mt-2">View Pass &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
