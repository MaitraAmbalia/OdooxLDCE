import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Wifi, Sparkles, CheckCircle2, Copy, Download, Share2, AlertCircle } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

export default function MembershipCard({ membership }) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!membership) return null;

  const isActive = membership.status === "ACTIVE";
  const isLapsed = membership.status === "LAPSED";
  const memberCode = membership.code || membership.id || "SKYL-MEM-2026";
  const memberNumber = membership.memberNumber || `SKYL-${String(membership.id || "0001").slice(0, 6).toUpperCase()}`;

  const copyCode = () => {
    navigator.clipboard.writeText(memberCode);
    setCopied(true);
    toast.success("Membership ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

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
                    <p className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">Official Student Pass</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-slate-400 rotate-90" title="Contactless NFC Enabled" />
                  <Badge 
                    variant={isActive ? "success" : isLapsed ? "destructive" : "warning"}
                    className="text-[11px] uppercase font-bold tracking-wider py-0.5 px-2"
                  >
                    {membership.status || "ACTIVE"}
                  </Badge>
                </div>
              </div>

              {/* Student Identity Section */}
              <div className="my-6">
                <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">Registered Student</div>
                <div className="text-2xl font-display font-extrabold text-white tracking-tight mt-0.5">
                  {membership.user?.name || "Student Member"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    ★ {membership.tier?.name || "Standard Membership Tier"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {memberNumber}
                  </span>
                </div>
              </div>

              {/* QR Code Centerpiece */}
              <div className="bg-white p-3.5 rounded-2xl shadow-xl w-fit mx-auto border-2 border-slate-100 flex flex-col items-center group-hover:shadow-blue-500/20 transition-all">
                <QRCodeSVG 
                  value={memberCode} 
                  size={148}
                  level="H"
                  includeMargin={false}
                />
                <span className="text-[9px] font-mono text-slate-500 mt-1 font-semibold uppercase tracking-wider">
                  Tap card to view security details
                </span>
              </div>

              {/* Footer: Expiration & Verification */}
              <div className="flex items-end justify-between border-t border-slate-800/80 pt-4 mt-4">
                <div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">Valid Until</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {membership.validUntil 
                      ? new Date(membership.validUntil).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : "May 31, 2027"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-mono uppercase text-slate-400">Security Gate</div>
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
                  <span className="text-[11px] font-mono text-slate-400">Tap to flip back</span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] uppercase font-mono text-slate-400">Cryptographic Token</div>
                      <div className="font-mono text-xs text-blue-300 font-bold truncate max-w-[200px]">{memberCode}</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyCode(); }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Copy ID"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[11px] uppercase font-mono text-slate-400">Privileges Included</div>
                    <ul className="text-slate-300 space-y-1 text-[11px]">
                      <li>✓ Priority entry at all campus auditorium events</li>
                      <li>✓ Member discounts on official club merchandise</li>
                      <li>✓ Voting & candidacy in annual executive elections</li>
                      <li>✓ Access to closed volunteer & project registries</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 font-mono">
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
          variant="outline" 
          size="sm" 
          onClick={copyCode}
          className="flex-1 text-xs bg-white text-slate-800 shadow-2xs hover:bg-slate-50"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? "Copied!" : "Copy Pass ID"}</span>
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          onClick={handleDownloadPass}
          className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save to Wallet</span>
        </Button>
      </div>

      <p className="text-xs text-slate-500 text-center mt-3 flex items-center gap-1 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        Turn up screen brightness for instant door scanning at LDCE gates.
      </p>
    </div>
  );
}
