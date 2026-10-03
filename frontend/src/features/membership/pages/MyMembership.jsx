import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, Sparkles, CheckCircle2, ArrowRight, Zap, Award, 
  Calendar, Gift, History, Clock, AlertTriangle 
} from "lucide-react";
import MembershipCard, { MEMBER_PERKS } from "../components/MembershipCard";
import { StatusBadge } from "../../../components/common/StatusBadge";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function MyMembership() {
  usePageTitle("My membership");
  const { data: membershipData, isPending, isError, refetch } = useQuery({
    queryKey: ['myMembership'],
    queryFn: async () => {
      const res = await fetch("/api/v1/memberships/me", { credentials: "include" });
      if (res.status === 401 || res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch membership");
      return res.json();
    }
  });

  const membership = membershipData?.data?.current || null;
  const history = membershipData?.data?.history || [];
  const validUntil = membership?.validUntil ?? membership?.expiresAt;
  const daysLeft = validUntil ? Math.ceil((new Date(validUntil) - Date.now()) / 86400000) : null;

  if (isPending) {
    return (
      <div className="page-container max-w-4xl py-12" role="status" aria-label="Loading membership">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[380px] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl py-12 sm:py-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> Your Skyline membership
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Digital membership pass
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Show this pass at the door, and get member prices on tickets and merch.
          </p>
        </div>

        {!membership && (
          <Link to="/join">
            <Button>
              <Shield aria-hidden="true" /> Explore membership
            </Button>
          </Link>
        )}
      </div>

      {isError ? (
        <ContentState error title="Your membership isn’t available right now." description="We couldn’t load your membership details. Try again in a moment." action={refetch} />
      ) : !membership ? (
        /* Empty State with strong conversion hook */
        <div className="mx-auto max-w-2xl rounded-2xl bg-[#272747] p-8 text-center text-white sm:p-12">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white/10 text-[#c6c3f3]">
            <Shield className="size-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            Make more of campus life.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#d2d2e2]">
            You don’t have an active pass yet. Join for event and shop benefits, plus more ways to take part in the community.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/join">
              <Button size="lg" className="w-full bg-white text-[#272747] hover:bg-[#eeedf7] sm:w-auto">
                View membership options
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto">
                Explore events
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Active Member View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: The Digital Wallet Card */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <MembershipCard membership={membership} />
          </div>

          {/* Right Column: Perks, Tier Details & History */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Membership details: all from the membership record */}
            <Card className="rounded-2xl shadow-xs">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Award className="size-4 text-primary" /> {membership.tier?.name ?? membership.tierName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={membership.status} /></div>
                {membership.startsAt && <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="font-medium">{fmtDate(membership.startsAt)}</span></div>}
                {validUntil && <div className="flex justify-between"><span className="text-muted-foreground">Valid until</span><span className="font-medium">{fmtDate(validUntil)}</span></div>}
                {daysLeft != null && (
                  <div className={"rounded-xl p-3 text-sm " + (daysLeft <= 30 ? "bg-warning-soft text-warning" : "bg-secondary text-secondary-foreground")}>
                    {daysLeft <= 0 ? "Your membership has expired." : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left.`}
                    {daysLeft <= 30 && <Link to="/join" className="ml-1 font-semibold underline">Renew now</Link>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xs">
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">What your membership includes</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                {MEMBER_PERKS.map(([title, body]) => (
                  <div key={title} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{body}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/events" className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-xs">
                <Calendar className="mb-2 size-5 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold">Browse events</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Member prices apply</p>
              </Link>
              <Link to="/shop" className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-xs">
                <Gift className="mb-2 size-5 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold">Shop</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Member rates on merch</p>
              </Link>
            </div>

            {history.length > 0 && (
              <Card className="rounded-2xl shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-1.5 text-base font-semibold"><History className="size-4" /> Past memberships</CardTitle></CardHeader>
                <CardContent className="divide-y divide-border pt-0 text-sm">
                  {history.map((h) => <div key={h.id} className="flex items-center justify-between py-2.5"><span>{h.tierName ?? h.tier?.name} <span className="text-xs text-muted-foreground">· {h.startsAt ? fmtDate(h.startsAt) : "—"} – {h.expiresAt ? fmtDate(h.expiresAt) : "—"}</span></span><StatusBadge status={h.status} /></div>)}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
