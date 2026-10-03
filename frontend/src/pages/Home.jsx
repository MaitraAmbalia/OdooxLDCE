import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Calendar, Ticket, ShieldCheck, ArrowRight, ShoppingBag, Users, CheckCircle2, ChevronRight, Award, Compass, TrendingUp, Clock, MapPin, BarChart3, HandHelping, ScanLine, Star, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { StatusBadge } from "../components/common/StatusBadge";
import { formatINR } from "../lib/utils";

export default function Home() {
  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: async () => {
      const res = await fetch("/api/v1/events");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch("/api/v1/products");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const user = authData?.data;
  const events = eventsData?.data || [];
  const galaEvent = events.find(e => e.title?.includes('Gala')) || events[0];
  const galaTypes = galaEvent?.ticketTypes || [];
  const memberType = galaTypes.find(t => t.audience === 'MEMBER');
  const publicType = galaTypes.find(t => t.audience !== 'MEMBER');
  const galaPrice = memberType || publicType;
  const discountPct = memberType && publicType && Number(publicType.pricePaise) > 0
    ? Math.round((1 - Number(memberType.pricePaise) / Number(publicType.pricePaise)) * 100)
    : 0;
  const products = productsData?.data || [];
  const hoodie = products[0];

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. Hero Section: Rich, Luminous Gradient with Consumer-First CTAs */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white py-20 px-4 sm:px-6 lg:px-8">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/30 to-amber-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-blue-200 mb-6 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Student Organization Operating Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight mb-6 leading-[1.08] text-balance">
            Where Campus Life <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Happens in Real Time.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 mb-10 leading-relaxed text-balance">
            From instant member discounts and scannable Gala passes to official hoodies and student governance, Skyline connects all LDCE & Nirma university moments.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <>
                <Link to="/events">
                  <Button variant="default" size="lg" className="shadow-lg shadow-blue-500/25">
                    <Calendar className="w-4 h-4" />
                    Browse Upcoming Events
                  </Button>
                </Link>
                <Link to="/me">
                  <Button variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 border-white/25 text-white">
                    Open My Student Hub
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/join">
                  <Button variant="gold" size="lg">
                    <ShieldCheck className="w-4 h-4 text-amber-950" />
                    Join Membership (Save 50%)
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 border-white/25 text-white">
                    Explore Events
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Social Proof Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 pt-10 border-t border-white/10 text-left">
            <div>
              <p className="text-3xl sm:text-4xl font-display font-extrabold text-white">₹150</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Member Gala Price <span className="line-through text-slate-400">₹300</span></p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-display font-extrabold text-blue-400">1.2s</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">High-Velocity Door Check-In</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-display font-extrabold text-amber-400">100%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Transparent Student Ledger</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-display font-extrabold text-emerald-400">0%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Platform Fee Surcharges</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Spotlight Flagship Event Card */}
      {galaEvent && (
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl border border-slate-200/80 bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-amber-900/5 p-6 sm:p-10 overflow-hidden shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="gold">
                    <Star className="w-3.5 h-3.5" aria-hidden="true" /> Featured Event
                  </Badge>
                  <StatusBadge status="PUBLISHED" />
                </div>

                <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
                  {galaEvent.title}
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {galaEvent.description || "The premier celebration of cultural showcases, student innovation, awards, and networking on campus."}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{galaEvent.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{new Date(galaEvent.startAt || galaEvent.startDate || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{galaEvent.capacity ? `${galaEvent.capacity} capacity` : "Open entry"}</span>
                  </div>
                </div>
              </div>

              {/* Pricing & CTA Panel */}
              <div className="w-full lg:w-auto shrink-0 bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col items-center text-center space-y-4 min-w-[280px]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Admission Ticket</span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-display font-extrabold text-slate-900">
                      {galaPrice ? (Number(galaPrice.pricePaise) === 0 ? "Free" : formatINR(galaPrice.pricePaise, true)) : "TBA"}
                    </span>
                    {discountPct > 0 && (
                      <span className="text-sm font-semibold text-slate-500 line-through">{formatINR(publicType.pricePaise, true)}</span>
                    )}
                  </div>
                  {discountPct > 0 && (
                    <span className="inline-block text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      {discountPct}% member discount
                    </span>
                  )}
                </div>

                <Link to={`/events/${galaEvent.id}`} className="w-full">
                  <Button variant="default" size="md" className="w-full justify-center">
                    <Ticket className="w-4 h-4" />
                    Get Admission Pass
                  </Button>
                </Link>
                <p className="text-[11px] text-slate-400">Zero booking fees • Instant QR pass</p>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 3. The 3 Pillars of Skyline Value */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" className="mb-3">
            Integrated Campus Ecosystem
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900">
            Engineered for Students & Student Leaders
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Eliminating scattered WhatsApp group chats, manual paper lists, and opaque cash handling with a unified operating system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Membership Pass */}
          <Card className="flex flex-col justify-between hover:border-blue-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle>Digital Membership Pass</CardTitle>
              <CardDescription>
                Your phone is your club credential. Unlock 50% discount on Gala passes, members-only hoodie rates, and leadership eligibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dynamic scannable QR card in digital wallet</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic member checkout discounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Eligibility to apply for leadership roles</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link to="/join" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Explore Membership Tiers</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card 2: Merchandise Store */}
          <Card className="flex flex-col justify-between hover:border-amber-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <CardTitle>Campus Merchandise Store</CardTitle>
              <CardDescription>
                Heavyweight navy fleece hoodies embroidered with the Skyline crest. Real-time size inventory and easy on-campus collection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">Signature Club Hoodie</p>
                  <p className="text-[11px] text-slate-500">Sizes S, M, L, XL in stock</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹899</p>
                  <p className="text-[11px] text-slate-400 line-through">₹1,199</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/shop" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Browse Official Apparel</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card 3: Governance & Leadership */}
          <Card className="flex flex-col justify-between hover:border-emerald-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <CardTitle>Leadership & Elections</CardTitle>
              <CardDescription>
                Run for executive office. Faculty Mentor verified applications, meeting agendas with minute tallies, and transparent double-entry ledgers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Merit-based candidate review & appointments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Audited double-entry general ledger</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Strict task-scoped volunteer communication</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link to="/selection" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>View Open Leadership Cycles</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

        </div>
      </section>

      {/* 4. Quick Access Persona Launcher (For Evaluators & Leaders) */}
      <section className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <Compass className="w-4 h-4" /> Evaluator & Role Quick Access
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                Explore Operation Consoles
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Jump directly into role-specific management boards, volunteer task channels, or the live door scanner.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link to="/volunteer">
                <Button variant="dark" size="sm" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs">
                  <HandHelping className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Volunteer Hub
                </Button>
              </Link>
              <Link to="/door/00000000-0000-0000-0000-000000000001">
                <Button variant="dark" size="sm" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs">
                  <ScanLine className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Door QR Scanner
                </Button>
              </Link>
              <Link to="/manage">
                <Button variant="dark" size="sm" className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold">
                  <Zap className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Executive Manage Hub
                </Button>
              </Link>
              <Link to="/manage/finance/ledger">
                <Button variant="dark" size="sm" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs">
                  <BarChart3 className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Treasury Ledger
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
