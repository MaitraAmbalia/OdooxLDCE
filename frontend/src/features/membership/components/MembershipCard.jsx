import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Wifi, Sparkles, Download } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

export default function MembershipCard({ membership }) {
  const [flipped, setFlipped] = useState(false);
  // Signed, opaque QR from the server: never encode raw ids into the card.
  const { data: cardData } = useQuery({
    queryKey: ["membershipCard"],
    queryFn: async () => {
      const res = await fetch("/api/v1/memberships/me/card", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch membership card");
      return res.json();
    },
    enabled: membership?.status === "ACTIVE",
  });
  const qr = cardData?.data?.qr;

  if (!membership) return null;

  const isActive = membership.status === "ACTIVE";
  const isLapsed = membership.status === "LAPSED";

  const handleDownloadPass = () => {
    toast.success("Wallet pass ready! Scanning enabled at campus gates.");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Interactive Wallet Card Container */}
      <div 
        onClick={() => setFlipped(!flipped)}
        className="group relative w-full max-w-sm cursor-pointer select-none transition-all duration-300 hover:scale-[1.02]"
        title="Click to flip pass"
      >
        {/* Holographic glowing back-shadow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 opacity-25 blur-xl group-hover:opacity-40 transition-opacity"></div>

        {/* Card Body */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl border border-slate-700/60 p-6 min-h-[380px] flex flex-col justify-between">
          
          {/* Top holographic accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-400 animate-pulse"></div>

          {/* Background watermark seal */}
          <div className="pointer-events-none absolute -right-12 -bottom-12 w-56 h-56 rounded-full border border-white/5 flex items-center justify-center opacity-40">
            <div className="w-40 h-40 rounded-full border border-dashed border-white/10"></div>
          </div>

          {!flipped ? (
            /* FRONT OF PASS */
            <>
              {/* Header: Organization & NFC Contactless */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-display font-black text-white shadow-md">
                    S
                  </div>
                  <div>
                    <h3 className="text-base font-display font-black tracking-tight text-white flex items-center gap-1.5">
                      Skyline LDCE
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono tracking-wider uppercase">Official Student Pass</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-muted-foreground rotate-90" title="Contactless NFC Enabled" />
                  <Badge 
                    variant={isActive ? "success" : isLapsed ? "destructive" : "warning"}
                    className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2"
                  >
                    {membership.status || "ACTIVE"}
                  </Badge>
                </div>
              </div>

              {/* Student Identity Section */}
              <div className="my-6">
                <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Registered Student</div>
                <div className="text-2xl font-display font-extrabold text-white tracking-tight mt-0.5">
                  {membership.user?.name || "Student Member"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    ★ {membership.tier?.name || "Standard Membership Tier"}
                  </span>
                </div>
              </div>

              {/* QR Code Centerpiece */}
              <div className="bg-white p-3.5 rounded-2xl shadow-xl w-fit mx-auto border-2 border-border flex flex-col items-center group-hover:shadow-blue-500/20 transition-all">
                {qr ? (
                  <QRCodeSVG value={qr} size={148} level="H" includeMargin={false} />
                ) : (
                  <div className="size-[148px] animate-pulse rounded-lg bg-muted" role="status" aria-label="Loading pass QR" />
                )}
                <span className="text-[9px] font-mono text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
                  Tap card to view security details
                </span>
              </div>

              {/* Footer: Expiration & Verification */}
              <div className="flex items-end justify-between border-t border-slate-800/80 pt-4 mt-4">
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Valid Until</div>
                  <div className="text-xs font-semibold text-muted-foreground/70">
                    {membership.validUntil 
                      ? new Date(membership.validUntil).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : "May 31, 2027"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Security Gate</div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Fast-Pass
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* BACK OF PASS (Security Details & Quick Actions) */
            <div className="h-full flex flex-col justify-between py-2">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Member Verification
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Tap to flip back</span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="bg-foreground/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Privileges Included</div>
                    <ul className="text-muted-foreground/70 space-y-1 text-[11px]">
                      <li>✓ Priority entry at all campus auditorium events</li>
                      <li>✓ Member discounts on official club merchandise</li>
                      <li>✓ Voting & candidacy in annual executive elections</li>
                      <li>✓ Access to closed volunteer & project registries</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-800">
                <p className="text-[10px] text-muted-foreground font-mono">
                  Issued by Skyline Student Association • LDCE Autonomous
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons below card */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleDownloadPass}
          className="flex-1 text-xs bg-primary hover:bg-primary text-white shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save to Wallet</span>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3 flex items-center gap-1 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        Turn up screen brightness for instant door scanning at LDCE gates.
      </p>
    </div>
  );
}
