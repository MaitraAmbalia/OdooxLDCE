import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, Sparkles, CheckCircle2, ArrowRight, Zap, Award, 
  Calendar, Gift, History, Clock, AlertTriangle 
} from "lucide-react";
import MembershipCard from "../components/MembershipCard";
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

  const membership = membershipData?.data?.current || membershipData?.data;

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
            Your credential for event check-in, workshop priority, and member pricing.
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
            
            {/* Membership Status & Benefits Overview */}
            <Card className="rounded-2xl border-border/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Tier Privileges Active
                  </CardTitle>
                  <Badge variant="success">All Benefits Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Exclusive Event Pricing</div>
                    <div className="text-xs text-muted-foreground">Save up to 40% on tickets for the Skyline Annual Gala and workshops.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Merch Store Discounts</div>
                    <div className="text-xs text-muted-foreground">Automatic ₹200 OFF on all official hoodies, tees, and varsity jackets.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Leadership Candidacy</div>
                    <div className="text-xs text-muted-foreground">Only verified active members can apply for Executive Board positions.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Contactless 1.2s Fast Pass</div>
                    <div className="text-xs text-muted-foreground">Skip the manual check-in lines at the auditorium with instant QR verification.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/events" className="block">
                <div className="p-4 rounded-xl border border-border bg-white hover:border-blue-400 hover:shadow-xs transition-all group">
                  <Calendar className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-foreground">Browse Events</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Use your member discount</div>
                </div>
              </Link>
              <Link to="/shop" className="block">
                <div className="p-4 rounded-xl border border-border bg-white hover:border-amber-400 hover:shadow-xs transition-all group">
                  <Gift className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-foreground">Merch Catalog</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Member rates available</div>
                </div>
              </Link>
            </div>

            {/* Pass Ledger / History */}
            <Card className="rounded-2xl border-border/90 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Membership Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                  <div>
                    <span className="font-semibold text-foreground">Pass Activated</span>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {new Date(membership.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <div>
                    <span className="font-semibold text-foreground">Validity Horizon</span>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Through {membership.validUntil ? new Date(membership.validUntil).toLocaleDateString('en-IN') : 'May 2027'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-primary font-bold">In Good Standing</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
