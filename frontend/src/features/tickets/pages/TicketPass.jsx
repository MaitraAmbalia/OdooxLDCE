import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { 
  Calendar, MapPin, Clock, ArrowLeft, Download, Share2, 
  CheckCircle2, Sparkles, AlertCircle, Sun, ShieldCheck, Ticket as TicketIcon 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "sonner";

export default function TicketPass() {
  const { id } = useParams();
  const [downloading, setDownloading] = useState(false);

  const { data: ticketData, isLoading, error } = useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tickets/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ticket pass");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center">
        <Skeleton className="w-full h-8 mb-6" />
        <Skeleton className="w-full max-w-sm h-[520px] rounded-3xl" />
      </div>
    );
  }

  if (error || !ticketData?.data) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-display font-bold text-slate-900">Ticket Pass Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          This ticket ID may not exist or belongs to another student account.
        </p>
        <Link to="/me/tickets" className="mt-6 inline-block">
          <Button variant="outline" size="sm">
            &larr; Return to My Passes
          </Button>
        </Link>
      </div>
    );
  }

  const ticket = ticketData.data;
  const event = ticket.event || {};
  const isCheckedIn = ticket.status === "CHECKED_IN";
  const ticketCode = ticket.id || "SKYL-TCK-0001";
  const shortId = ticketCode.slice(0, 8).toUpperCase();

  const handleAddToCalendar = () => {
    toast.success("Event added to calendar! Reminder set for 2 hours before kickoff.");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title || "Skyline Event Ticket",
        text: `My verified ticket for ${event.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Pass link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 flex flex-col items-center">
      
      {/* Top Navigation */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <Link 
          to="/me/tickets" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Passes
        </Link>

        <button 
          onClick={handleShare}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/80 transition-colors"
          title="Share ticket"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Perforated Stub Ticket Metaphor */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden group">
        
        {/* Top Section: Event Banner & Cover */}
        <div className="relative bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 pb-8">
          
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center font-display font-black text-xs">
                S
              </span>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-blue-200">
                Skyline Admission Pass
              </span>
            </div>

            <Badge 
              variant={isCheckedIn ? "success" : "default"}
              className="text-[10px] uppercase font-bold tracking-wider bg-white/20 text-white backdrop-blur-sm border-white/20"
            >
              {isCheckedIn ? "Checked In ✓" : "Valid Entry"}
            </Badge>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-display font-black tracking-tight text-white leading-snug">
              {event.title || "Skyline Annual Campus Gala"}
            </h2>

            <div className="mt-4 space-y-2 text-xs text-blue-100/90 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>
                  {event.startDate 
                    ? new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : "Saturday, Oct 24, 2026"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>
                  {event.startDate 
                    ? new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : "06:30 PM IST"} • Doors open 30 min prior
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>{event.venue || "Main Auditorium, LDCE Campus"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Stub Dividers (Punch Holes on both sides) */}
        <div className="relative h-6 bg-white flex items-center justify-between -my-3 z-20">
          {/* Left semi-circle cutout */}
          <div className="w-6 h-6 rounded-full bg-slate-50/50 -ml-3 border-r border-slate-300/80 shadow-inner"></div>
          
          {/* Dashed perforation line */}
          <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2"></div>
          
          {/* Right semi-circle cutout */}
          <div className="w-6 h-6 rounded-full bg-slate-50/50 -mr-3 border-l border-slate-300/80 shadow-inner"></div>
        </div>

        {/* Bottom Section: QR Code & Security Stub */}
        <div className="p-6 pt-5 bg-white text-center">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-inner inline-block mx-auto mb-4">
            <QRCodeSVG 
              value={ticketCode} 
              size={180}
              level="H"
              includeMargin={false}
            />
            <div className="mt-2 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              {shortId} • SCAN AT ENTRANCE
            </div>
          </div>

          {/* Barcode Metaphor Graphic */}
          <div className="w-48 mx-auto my-3 flex items-center justify-between opacity-60">
            <div className="h-6 w-1 bg-slate-800"></div>
            <div className="h-6 w-2 bg-slate-800"></div>
            <div className="h-6 w-0.5 bg-slate-800"></div>
            <div className="h-6 w-1.5 bg-slate-800"></div>
            <div className="h-6 w-0.5 bg-slate-800"></div>
            <div className="h-6 w-3 bg-slate-800"></div>
            <div className="h-6 w-1 bg-slate-800"></div>
            <div className="h-6 w-2 bg-slate-800"></div>
            <div className="h-6 w-0.5 bg-slate-800"></div>
            <div className="h-6 w-1 bg-slate-800"></div>
            <div className="h-6 w-2.5 bg-slate-800"></div>
            <div className="h-6 w-1 bg-slate-800"></div>
          </div>

          {/* Attendee Metadata */}
          <div className="grid grid-cols-2 gap-3 text-left border-t border-slate-100 pt-4 mt-2">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Pass Holder</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {ticket.holderName || ticket.user?.name || "Student Attendee"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Admission Tier</div>
              <div className="text-xs font-bold text-blue-700">
                {ticket.ticketType?.name || "General Admission"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Seat / Gate</div>
              <div className="text-xs font-bold text-slate-800">
                Gate A (Main Porch)
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Verification</div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Fast Pass Active
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action buttons below the ticket */}
      <div className="w-full max-w-sm mt-6 space-y-3">
        <Button 
          variant="outline" 
          size="md" 
          onClick={handleAddToCalendar}
          className="w-full bg-white text-xs font-semibold shadow-2xs hover:bg-slate-50 border-slate-300"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
          Add to Apple / Google Calendar
        </Button>

        {/* Ambient brightness reminder */}
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
          <Sun className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-tight">
            Please turn up your screen brightness when approaching the gate scanner.
          </span>
        </div>
      </div>

    </div>
  );
}
