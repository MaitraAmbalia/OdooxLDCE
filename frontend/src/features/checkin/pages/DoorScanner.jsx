import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleAlert, Keyboard, QrCode, RotateCcw, Search, UserCheck, Users, X, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getSocket } from "@/lib/socket";

export default function DoorScanner() {
  const { eventId } = useParams();
  const [scanResult, setScanResult] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [showAttendees, setShowAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [liveCheckedIn, setLiveCheckedIn] = useState(null);
  const [attendeesList, setAttendeesList] = useState([]);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const resetTimerRef = useRef(null);

  const { data: eventData } = useQuery({
    queryKey: ["events", eventId],
    queryFn: async () => {
      const response = await fetch("/api/v1/events/" + eventId);
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });
  const event = eventData?.data;
  usePageTitle(event?.title ? event.title + " check-in" : "Door check-in");

  // Fetch initial attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ["events", eventId, "attendance"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tickets/event/${eventId}/attendance`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (attendanceData?.data) {
      setLiveCheckedIn(attendanceData.data.totalCheckedIn);
      setAttendeesList(attendanceData.data.attendees || []);
    }
  }, [attendanceData]);

  // Real-time WebSocket synchronization across all scanning gates
  useEffect(() => {
    if (!eventId) return;
    const socket = getSocket();
    socket.emit("join:event", eventId);

    const handleAttended = (data) => {
      if (typeof data.totalCheckedIn === "number") {
        setLiveCheckedIn(data.totalCheckedIn);
      }
      if (data.attendee) {
        setAttendeesList((prev) => [
          data.attendee,
          ...prev.filter((a) => a.ticketId !== data.attendee.ticketId),
        ]);
      }
    };

    socket.on("checkin:attended", handleAttended);

    return () => {
      socket.emit("leave:event", eventId);
      socket.off("checkin:attended", handleAttended);
    };
  }, [eventId]);

  const clearResult = useCallback(() => {
    setScanResult(null);
    processingRef.current = false;
    try { scannerRef.current?.resume(); } catch {}
  }, []);

  const processTicket = useCallback(async (rawQr) => {
    const qr = rawQr.trim();
    if (!qr || processingRef.current) return;
    processingRef.current = true;
    try { scannerRef.current?.pause(true); } catch {}

    try {
      const response = await fetch("/api/v1/tickets/checkin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr, eventId }),
      });
      const json = await response.json();
      if (!response.ok) {
        const code = json.error?.code;
        const isAlreadyUsed = response.status === 409 || code === "ALREADY_CHECKED_IN";
        setScanResult({ status: isAlreadyUsed ? "WARN" : "ERR", title: isAlreadyUsed ? "Already checked in" : "Entry denied", name: "", message: json.error?.message || "This ticket could not be checked in." });
      } else {
        setScanResult({ status: "OK", title: "Checked in", name: json.data?.attendeeName || "Attendee", message: [json.data?.studentId, json.data?.ticketType, json.data?.eventTitle].filter(Boolean).join(" · ") });
        if (typeof json.data?.totalCheckedIn === "number") {
          setLiveCheckedIn(json.data.totalCheckedIn);
        }
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } catch {
      setScanResult({ status: "ERR", title: "Connection problem", name: "", message: "The check-in service could not be reached. Try again." });
    }

    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(clearResult, 3500);
  }, [clearResult, eventId]);

  useEffect(() => {
    let html5QrCode;
    let isComponentMounted = true;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            if (isComponentMounted) processTicket(decodedText);
          },
          () => {}
        );
        scannerRef.current = html5QrCode;
      } catch (err) {
        if (isComponentMounted) {
          setCameraError("Camera access denied or unavailable. Please allow camera permissions or enter the ticket ID manually.");
        }
      }
    };

    startScanner();

    return () => {
      isComponentMounted = false;
      clearTimeout(resetTimerRef.current);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [processTicket]);

  const submitManual = (eventObject) => {
    eventObject.preventDefault();
    if (!manualId.trim()) return;
    setManualOpen(false);
    processTicket(manualId);
    setManualId("");
  };

  const totalAttendeesCount = liveCheckedIn ?? event?.checkedInCount ?? 0;
  const totalCapacity = event?.capacity || event?.seatsSold || 0;
  const filteredAttendees = attendeesList.filter((a) => {
    if (!attendeeSearch.trim()) return true;
    const q = attendeeSearch.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.studentId.toLowerCase().includes(q) || a.ticketType?.toLowerCase().includes(q);
  });

  const resultStyle = scanResult?.status === "OK" ? "bg-emerald-600" : scanResult?.status === "WARN" ? "bg-amber-500" : "bg-red-600";
  const ResultIcon = scanResult?.status === "OK" ? CheckCircle2 : scanResult?.status === "WARN" ? CircleAlert : XCircle;

  return (
    <main className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
          <Link to={eventId ? "/events/" + eventId : "/events"}><ArrowLeft aria-hidden="true" /> Exit</Link>
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{event?.title || "Event check-in"}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <UserCheck className="size-3.5" /> {totalAttendeesCount} Attended
            </span>
            <span className="text-slate-500">·</span>
            <span>{totalCapacity ? `${totalCapacity} capacity` : "Live door tracking"}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAttendees(true)}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white font-medium text-xs flex items-center gap-1.5"
        >
          <Users className="size-3.5" /> Attendees ({totalAttendeesCount})
        </Button>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden bg-black" aria-label="Ticket scanner">
        <div id="reader" className="h-full w-full [&_video]:object-cover" />
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 mx-auto w-fit rounded-full bg-black/70 px-5 py-2.5 text-xs font-medium text-slate-200 backdrop-blur-md shadow-lg border border-white/10">Hold the ticket QR code inside the frame</div>

        {cameraError && <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-red-400/30 bg-red-950/90 p-4 text-sm shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4" role="alert">{cameraError}</div>}

        {scanResult && <div className={"absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200 " + resultStyle} aria-live="assertive"><ResultIcon className="size-24 drop-shadow-md" aria-hidden="true" /><h2 className="mt-8 font-display text-4xl font-semibold tracking-tight">{scanResult.title}</h2>{scanResult.name && <p className="mt-3 text-2xl font-medium">{scanResult.name}</p>}<p className="mt-3 max-w-md text-base text-white/90 leading-relaxed">{scanResult.message}</p><Button type="button" variant="outline" size="lg" className="mt-10 border-transparent bg-white/20 text-white hover:bg-white/30 hover:text-white backdrop-blur-md" onClick={() => { clearTimeout(resetTimerRef.current); clearResult(); }}><RotateCcw aria-hidden="true" /> Scan next ticket</Button></div>}
      </section>

      {/* Live Attendees Drawer */}
      {showAttendees && (
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-slate-900 border-l border-white/10 text-white shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Users className="size-5 text-primary" /> Live Attendees
              </h2>
              <p className="text-xs text-slate-400">
                {totalAttendeesCount} participant{totalAttendeesCount === 1 ? "" : "s"} checked in
              </p>
            </div>
            <button
              onClick={() => setShowAttendees(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close attendee drawer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                placeholder="Search attendee by name or ID…"
                className="h-9 w-full rounded-md border border-white/10 bg-slate-800 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredAttendees.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {attendeesList.length === 0 ? "No participants checked in yet. Scanned passes will appear here in real-time." : "No matching attendees found."}
              </div>
            ) : (
              filteredAttendees.map((attendee, idx) => (
                <div
                  key={attendee.ticketId || idx}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/80 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm">{attendee.name}</p>
                    <p className="text-xs text-slate-400">{attendee.studentId} · {attendee.ticketType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                      Attended
                    </span>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      <footer className="relative z-20 border-t border-white/10 bg-slate-950 p-4">
        {!manualOpen ? (
          <Button
            type="button"
            variant="outline"
            className="mx-auto flex w-full max-w-sm border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={() => setManualOpen(true)}
          >
            <Keyboard aria-hidden="true" /> Enter ticket ID or pass code manually
          </Button>
        ) : (
          <form onSubmit={submitManual} className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row">
            <Input
              value={manualId}
              onChange={(eventObject) => setManualId(eventObject.target.value)}
              placeholder="Ticket UUID or pass code"
              aria-label="Ticket ID or pass code"
              autoFocus
              className="border-white/20 bg-white text-slate-950"
            />
            <Button type="submit" disabled={!manualId.trim()}>Check in</Button>
            <Button
              type="button"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setManualOpen(false)}
            >
              Cancel
            </Button>
          </form>
        )}
      </footer>
    </main>
  );
}
