import React from "react";
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

export default function MyMembership() {
  const { data: membershipData, isLoading, error } = useQuery({
    queryKey: ['myMembership'],
    queryFn: async () => {
      const res = await fetch("/api/v1/memberships/me", { credentials: "include" });
      if (res.status === 401 || res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch membership");
      return res.json();
    }
  });

  const membership = membershipData?.data?.current || membershipData?.data;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
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
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-950 mr-1" /> Verified Member
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight mt-1.5">
            Digital Membership Pass
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Your official credential for campus auditorium check-in, workshop priority, and merchandise discounts.
          </p>
        </div>

        {!membership && (
          <Link to="/join">
            <Button variant="gold" size="md">
              <Shield className="w-4 h-4 text-amber-950" />
              Join Membership
            </Button>
          </Link>
        )}
      </div>

      {!membership ? (
        /* Empty State with strong conversion hook */
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700/80 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto mb-6 border border-amber-400/30">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            Unlock the Full Campus Experience
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            You don't currently have an active Skyline student pass. Members save up to ₹4,500 every semester on annual Gala tickets, tech summits, club hoodies, and gain eligibility to lead projects.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/join">
              <Button variant="gold" size="lg" className="w-full sm:w-auto text-sm">
                View Membership Tiers &rarr;
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm border-slate-600 text-white bg-slate-800/80 hover:bg-slate-700">
                Explore Public Events
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
            <Card className="rounded-2xl border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
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
                    <div className="text-xs font-bold text-slate-900">Exclusive Event Pricing</div>
                    <div className="text-xs text-slate-500">Save up to 40% on tickets for the Skyline Annual Gala and workshops.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Merch Store Discounts</div>
                    <div className="text-xs text-slate-500">Automatic ₹200 OFF on all official hoodies, tees, and varsity jackets.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Leadership Candidacy</div>
                    <div className="text-xs text-slate-500">Only verified active members can apply for Executive Board positions.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Contactless 1.2s Fast Pass</div>
                    <div className="text-xs text-slate-500">Skip the manual check-in lines at the auditorium with instant QR verification.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/events" className="block">
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all group">
                  <Calendar className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900">Browse Events</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Use your member discount</div>
                </div>
              </Link>
              <Link to="/shop" className="block">
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all group">
                  <Gift className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900">Merch Catalog</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Member rates available</div>
                </div>
              </Link>
            </div>

            {/* Pass Ledger / History */}
            <Card className="rounded-2xl border-slate-200/90 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Membership Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">Pass Activated</span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {new Date(membership.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <div>
                    <span className="font-semibold text-slate-800">Validity Horizon</span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Through {membership.validUntil ? new Date(membership.validUntil).toLocaleDateString('en-IN') : 'May 2027'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-blue-600 font-bold">In Good Standing</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
