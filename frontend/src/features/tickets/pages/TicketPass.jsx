import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar, MapPin, Clock, ArrowLeft, Share2,
  Sun, ShieldCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "sonner";
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function TicketPass() {
  const { id } = useParams();

  const { data: ticketData, isPending, isError, refetch } = useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tickets/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ticket pass");
      return res.json();
    }
  });
  const ticket = ticketData?.data;
  const event = ticket?.event || {};
  usePageTitle(event.title ? `${event.title} pass` : "Ticket pass");

  if (isPending) {
    return (
      <div className="page-container flex max-w-md flex-col items-center py-12" role="status" aria-label="Loading ticket pass">
        <Skeleton className="w-full h-8 mb-6" />
        <Skeleton className="w-full max-w-sm h-[520px] rounded-3xl" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="page-container py-16"><ContentState error title="We couldn’t load this pass." description="It may not exist or may belong to another account." action={refetch} /></div>
    );
  }

  const isCheckedIn = ticket.status === "CHECKED_IN";
  const ticketCode = ticket.id || "SKYL-TCK-0001";
  const shortId = ticketCode.slice(0, 8).toUpperCase();

  const handleAddToCalendar = () => {
    const start = new Date(event.startAt || event.startDate);
    if (Number.isNaN(start.getTime())) {
      toast.error("This event does not have a confirmed date yet.");
      return;
    }
    const end = new Date(event.endAt || start.getTime() + 2 * 60 * 60 * 1000);
    const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${ticketCode}@skyline`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${event.title || "Skyline event"}`, `LOCATION:${event.venue || "Campus"}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(event.title || "skyline-event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded.");
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: event.title || "Skyline Event Ticket",
        text: `My verified ticket for ${event.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      try { await navigator.clipboard.writeText(window.location.href); toast.success("Pass link copied."); }
      catch { toast.error("Could not copy the pass link."); }
    }
  };

  return (
    <div className="page-container flex flex-col items-center py-10 sm:py-14">
      
      {/* Top Navigation */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <Link 
          to="/me/tickets" 
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> My passes
        </Link>

        <button 
          onClick={handleShare}
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          aria-label="Share ticket"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Perforated Stub Ticket Metaphor */}
      <div className="group relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
        
        {/* Top Section: Event Banner & Cover */}
        <div className="relative bg-[#272747] p-6 pb-8 text-white">
          
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center font-display font-black text-xs">
                S
              </span>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-[#c6c3f3]">
                Skyline admission pass
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
            <h1 className="font-display text-2xl font-semibold leading-snug tracking-tight text-white">
              {event.title || "Skyline event"}
            </h1>

            <div className="mt-4 space-y-2 text-xs text-blue-100/90 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>
                  {event.startAt || event.startDate
                    ? new Date(event.startAt || event.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : "Date to be announced"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>
                  {event.startAt || event.startDate
                    ? new Date(event.startAt || event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : "Time to be announced"}
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
          onClick={handleAddToCalendar}
          className="w-full bg-card"
        >
          <Calendar aria-hidden="true" /> Add to calendar
        </Button>

        {/* Ambient brightness reminder */}
        <div className="flex items-center gap-2.5 rounded-xl border border-[#ead2c4] bg-[#f6e8df] p-3 text-xs text-[#86533d]">
          <Sun className="size-4 shrink-0" />
          <span className="text-[11px] leading-tight">
            Please turn up your screen brightness when approaching the gate scanner.
          </span>
        </div>
      </div>

    </div>
  );
}
