import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

export default function TicketPass() {
  const { id } = useParams();

  const { data: ticketData, isLoading } = useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      // API endpoint: GET /tickets/:id
      const res = await fetch(`/api/v1/tickets/${id}`);
      if (!res.ok) throw new Error("Failed to fetch ticket pass");
      return res.json();
    }
  });

  // Brightness Hint - simulate maximizing screen brightness on open
  useEffect(() => {
    // In a real mobile environment (e.g. Capacitor/PWA), we'd request a wake lock or max brightness
    console.log("Max brightness requested for scanning");
  }, []);

  if (isLoading) return <div className="p-8 text-center text-[var(--color-muted)]">Loading ticket pass...</div>;
  if (!ticketData?.data) return <div className="p-8 text-center text-[var(--color-stop)]">Ticket not found.</div>;

  const ticket = ticketData.data;
  const isCheckedIn = ticket.status === "CHECKED_IN";
  // The event cover color metaphor (using a fallback color if not present)
  const coverColor = "var(--color-dusk)";

  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
      <Link to="/me/tickets" className="self-start mb-6 text-sm font-medium text-[var(--color-dusk)] hover:underline">
        &larr; Back to my tickets
      </Link>

      <div className="w-full max-w-sm rounded-[18px] shadow-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-line)]">
        {/* Ticket Header (Event Details) */}
        <div 
          className="p-6 text-white text-center relative"
          style={{ backgroundColor: coverColor }}
        >
          <div className="absolute -bottom-3 left-0 w-full flex justify-between px-[-8px]">
             {/* Stub perforation styling */}
             <div className="w-6 h-6 bg-[var(--color-paper)] rounded-full -ml-3 z-10 shadow-inner"></div>
             <div className="w-6 h-6 bg-[var(--color-paper)] rounded-full -mr-3 z-10 shadow-inner"></div>
          </div>
          
          <h2 className="text-2xl font-display font-bold tracking-tight">{ticket.event?.title || "Event Name"}</h2>
          <p className="mt-2 text-sm opacity-90">
            {new Date(ticket.event?.startDate || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
          </p>
          <p className="mt-1 text-sm opacity-90">{ticket.event?.venue || "Main Venue"}</p>
        </div>

        {/* Ticket Body (QR Code and Info) */}
        <div className="p-6 pt-10 text-center relative border-t-2 border-dashed border-[var(--color-line)]">
          <div className="mb-4">
            <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase rounded-full ${
              isCheckedIn ? 'bg-[var(--color-ok)] text-white' : 'bg-[var(--color-info)] text-white'
            }`}>
              {ticket.status || "ISSUED"}
            </span>
          </div>

          <div className="bg-white p-4 inline-block rounded-xl shadow-sm mb-6 border border-gray-100">
            <QRCodeSVG 
              value={ticket.id || "MOCK_TICKET"} 
              size={200}
              level="H"
            />
          </div>

          <div className="space-y-4 text-left border-t border-[var(--color-line)] pt-4">
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Ticket Holder</p>
              <p className="font-semibold text-[var(--color-ink)]">{ticket.holderName || ticket.user?.name || "Student"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Type</p>
              <p className="font-semibold text-[var(--color-ink)]">{ticket.ticketType?.name || "General Admission"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Ticket Number</p>
              <p className="font-mono text-sm text-[var(--color-ink)]">{ticket.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex gap-4 w-full max-w-sm">
        <button className="flex-1 py-2 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[6px] text-sm font-medium hover:bg-[var(--color-paper)]">
          Add to Calendar
        </button>
      </div>
      <p className="mt-6 text-xs text-[var(--color-muted)] text-center max-w-xs">
        Turn up your screen brightness when showing this code at the door.
      </p>
    </div>
  );
}
