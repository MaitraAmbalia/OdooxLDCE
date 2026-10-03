import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { sendJson } from "../../../lib/api";

// Only what the platform actually enforces for active members.
export const MEMBER_PERKS = [
  ["Member ticket prices", "Events with a member tier charge you the member price automatically at checkout."],
  ["Member shop prices", "Official merchandise is sold to you at the member rate."],
  ["Members-only events", "Register for events open to active members only."],
  ["Leadership applications", "Apply for executive and head roles when a selection cycle opens."],
  ["Digital door pass", "This QR is verified at the door for check-in and membership checks."],
];

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

export default function MembershipCard({ membership }) {
  const [flipped, setFlipped] = useState(false);
  const queryClient = useQueryClient();
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
  const rotate = useMutation({
    mutationFn: () => sendJson("/memberships/me/card/rotate"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["membershipCard"] }); toast.success("New pass code issued. Old screenshots no longer work."); },
    onError: (e) => toast.error(e.message),
  });
  const qr = cardData?.data?.qr;

  if (!membership) return null;
  const isActive = membership.status === "ACTIVE";
  const validUntil = membership.validUntil ?? membership.expiresAt;

  return (
    <div className="flex w-full flex-col items-center">
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="relative w-full max-w-sm select-none text-left transition-transform duration-300 hover:scale-[1.01]"
        aria-label={flipped ? "Show pass front" : "Show member benefits"}
      >
        <div className="relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-3xl bg-[#272747] p-6 text-white shadow-xl shadow-primary/10">
          <div className="poster-orbit text-white" aria-hidden="true" />

          {!flipped ? (
            <>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary font-display font-bold">S</div>
                  <div>
                    <p className="font-display text-base font-semibold tracking-tight">Skyline</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-white/60">Member pass</p>
                  </div>
                </div>
                <StatusBadge status={membership.status} />
              </div>

              <div className="relative my-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">Member</p>
                <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight">{membership.user?.name}</p>
                <p className="mt-1 text-sm text-[#c6c3f3]">{membership.tier?.name ?? membership.tierName} · {membership.user?.studentId}</p>
              </div>

              <div className="relative mx-auto flex w-fit flex-col items-center rounded-2xl bg-white p-3.5">
                {qr ? (
                  <QRCodeSVG value={qr} size={148} level="H" includeMargin={false} />
                ) : (
                  <div className="size-[148px] animate-pulse rounded-lg bg-muted" role="status" aria-label={isActive ? "Loading pass QR" : "Pass inactive"} />
                )}
              </div>

              <div className="relative mt-4 flex items-end justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="font-mono text-[10px] uppercase text-white/60">Valid until</p>
                  <p className="text-sm font-semibold">{validUntil ? fmt(validUntil) : "—"}</p>
                </div>
                <p className="text-[11px] text-white/60">Tap for benefits</p>
              </div>
            </>
          ) : (
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="font-display text-base font-semibold">Member benefits</p>
                <p className="text-[11px] text-white/60">Tap to flip back</p>
              </div>
              <ul className="mt-4 space-y-3">
                {MEMBER_PERKS.map(([title, body]) => (
                  <li key={title} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#c6c3f3]" aria-hidden="true" />
                    <span><span className="font-semibold">{title}</span><span className="block text-xs text-white/60">{body}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </button>

      {isActive && (
        <div className="mt-5 flex w-full max-w-sm flex-col items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => rotate.mutate()} disabled={rotate.isPending}>
            <RefreshCw className={rotate.isPending ? "animate-spin" : ""} aria-hidden="true" /> Issue a new pass code
          </Button>
          <p className="text-center text-xs text-muted-foreground">Shared a screenshot by mistake? A new code makes the old one stop working.</p>
        </div>
      )}
    </div>
  );
}
