import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleAlert, Keyboard, QrCode, RotateCcw, XCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function DoorScanner() {
  const { eventId } = useParams();
  const [scanResult, setScanResult] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [cameraError, setCameraError] = useState("");
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
        setScanResult({ status: "OK", title: "Checked in", name: json.data?.attendeeName || "Attendee", message: [json.data?.studentId, json.data?.eventTitle].filter(Boolean).join(" · ") });
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } catch {
      setScanResult({ status: "ERR", title: "Connection problem", name: "", message: "The check-in service could not be reached. Try again." });
    }

    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(clearResult, 3500);
  }, [clearResult, eventId]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true }, false);
    scanner.render((decodedText) => processTicket(decodedText), () => {});
    scannerRef.current = scanner;
    return () => {
      clearTimeout(resetTimerRef.current);
      scanner.clear().catch(() => {});
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

  const resultStyle = scanResult?.status === "OK" ? "bg-emerald-600" : scanResult?.status === "WARN" ? "bg-amber-500" : "bg-red-600";
  const ResultIcon = scanResult?.status === "OK" ? CheckCircle2 : scanResult?.status === "WARN" ? CircleAlert : XCircle;

  return (
    <main className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link to={eventId ? "/events/" + eventId : "/events"}><ArrowLeft aria-hidden="true" /> Exit</Link></Button>
        <div className="min-w-0 text-center"><p className="truncate text-sm font-semibold">{event?.title || "Event check-in"}</p><p className="text-xs text-slate-400">{event ? (event.seatsSold || 0) + " tickets issued · " + event.capacity + " capacity" : "Scan an entrance pass"}</p></div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><QrCode className="size-5" aria-hidden="true" /></span>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden bg-black" aria-label="Ticket scanner">
        <div id="reader" className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 mx-auto w-fit rounded-full bg-black/70 px-4 py-2 text-xs text-slate-200 backdrop-blur">Hold the ticket QR code inside the frame</div>

        {cameraError && <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-red-400/30 bg-red-950/90 p-4 text-sm" role="alert">{cameraError}</div>}

        {scanResult && <div className={"absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center " + resultStyle} aria-live="assertive"><ResultIcon className="size-20" aria-hidden="true" /><h2 className="mt-6 font-display text-4xl font-semibold">{scanResult.title}</h2>{scanResult.name && <p className="mt-3 text-2xl font-medium">{scanResult.name}</p>}<p className="mt-2 max-w-md text-base text-white/90">{scanResult.message}</p><Button type="button" variant="outline" size="lg" className="mt-8 border-white/50 bg-white text-slate-950 hover:bg-white/90" onClick={() => { clearTimeout(resetTimerRef.current); clearResult(); }}><RotateCcw aria-hidden="true" /> Scan next ticket</Button></div>}
      </section>

      <footer className="relative z-20 border-t border-white/10 bg-slate-950 p-4">
        {!manualOpen ? <Button type="button" variant="outline" className="mx-auto flex w-full max-w-sm border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => setManualOpen(true)}><Keyboard aria-hidden="true" /> Enter pass code manually</Button> : <form onSubmit={submitManual} className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row"><Input value={manualId} onChange={(eventObject) => setManualId(eventObject.target.value)} placeholder="Paste pass code" aria-label="Pass code" autoFocus className="border-white/20 bg-white text-slate-950" /><Button type="submit" disabled={!manualId.trim()}>Check in</Button><Button type="button" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setManualOpen(false)}>Cancel</Button></form>}
      </footer>
    </main>
  );
}
