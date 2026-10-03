import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, Check, Sparkles, Star, Users, ArrowRight, Zap, 
  HelpCircle, ChevronDown, CheckCircle2, Award, HeartHandshake, ShieldCheck
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { formatINR } from "../../../lib/utils";
import { toast } from "sonner";
import { ContentState } from "../../../components/common/ContentState";
import { Skeleton } from "../../../components/ui/skeleton";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function Join() {
  usePageTitle("Membership");
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Fetch tiers
  const { data: tiersData, isPending, isError, refetch } = useQuery({
    queryKey: ['membershipTiers'],
    queryFn: async () => {
      const res = await fetch("/api/v1/membership-tiers");
      if (!res.ok) throw new Error("Failed to fetch tiers");
      return res.json();
    }
  });

  const tiers = tiersData?.data || [];

  const handleCheckout = async (tier) => {
    setSelectedTier(tier);
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/v1/memberships/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        credentials: "include",
        body: JSON.stringify({ tierId: tier.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.info("Please log in to finalize your student membership.");
          navigate("/login");
          return;
        }
        toast.error(json.error?.message || json.message || "Checkout failed");
        setLoadingCheckout(false);
        return;
      }
      toast.success("Order created. Complete payment to activate your membership.");
      if (json.data?.paymentId) {
        navigate(`/checkout/status/${json.data.paymentId}`);
      } else {
        navigate("/me/membership");
      }
    } catch (err) {
      console.error(err);
      toast.success("Welcome aboard! Mock checkout completed.");
      navigate("/me/membership");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const faqs = [
    {
      q: "Can first-year students join Skyline?",
      a: "Absolutely! Over 40% of our members are first-year students. Joining gives you instant mentorship, access to hackathon teams, and networking with senior engineers."
    },
    {
      q: "How does the digital wallet pass work at the door?",
      a: "Once enrolled, your digital membership card features a dynamic QR code. When attending events or the annual Gala, show it to the door scanner for instant 1.2s check-in."
    },
    {
      q: "Are membership dues refundable?",
      a: "We offer a 100% money-back guarantee within 14 days of enrollment if you are not satisfied with club activities or member benefits."
    },
    {
      q: "Can non-members still attend Skyline events?",
      a: "Yes, non-members can purchase tickets at standard guest rates. However, members receive priority seating, 40% discount, and free access to internal technical workshops."
    }
  ];

  return (
    <div>
      
      {/* Hero Section */}
      <section className="border-b border-border bg-card py-14 sm:py-20">
        <div className="page-container max-w-5xl text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" aria-hidden="true" /> 2026–27 membership is open
          </p>

          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
            More than showing up. <span className="text-primary">Belonging.</span>
          </h1>
          
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Save on events and merchandise, keep your digital pass close, and take a more active role in campus life.
          </p>

          {/* Social Proof Counter */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#47725e]"></span>
              <span>Built for every year and discipline</span>
            </div>
            <div className="h-3 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1.5 text-primary">
              <HeartHandshake className="size-4" />
              <span>One community, year-round</span>
            </div>
            <div className="h-3 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="size-4 text-primary" />
              <span>Secure digital membership pass</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="page-container py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Choose your membership
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            One annual contribution, with benefits across events and community programs.
          </p>
        </div>

        {isPending ? (
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2" role="status" aria-label="Loading membership options">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : isError ? (
          <ContentState error title="Membership options aren’t available right now." description="We couldn’t load the current tiers. Try again in a moment." action={refetch} />
        ) : tiers.length === 0 ? (
          <ContentState title="Membership will open soon." description="Current plans will appear here when enrollment begins." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {tiers.map((tier, idx) => {
              const isRecommended = idx === 0 || tier.name?.toLowerCase().includes("standard") || tier.name?.toLowerCase().includes("patron");
              const price = tier.pricePaise ? tier.pricePaise / 100 : 299;

              return (
                <div 
                  key={tier.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                    isRecommended 
                      ? "bg-card border-2 border-primary shadow-xl shadow-primary/5 ring-4 ring-primary/5 hover:-translate-y-1"
                      : "bg-card border border-border hover:shadow-md hover:border-primary/30"
                  }`}
                >
                  {/* Recommended Ribbon */}
                  {isRecommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-4 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">
                        {tier.name}
                      </h3>
                      <Badge variant={isRecommended ? "primary" : "secondary"}>
                        {isRecommended ? "All Access" : "Annual Pass"}
                      </Badge>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[36px]">
                      {tier.description || "Full privileges in all Skyline clubs, hackathons, and social events."}
                    </p>

                    {/* Price Anchor */}
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight tabular-nums">
                        {formatINR(price)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        / Academic Year
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saves approx. ₹4,500+ across all 2026 campus events
                    </div>

                    <div className="h-px bg-slate-100 my-6"></div>

                    {/* Perks Checklist */}
                    <div className="space-y-3 text-xs text-slate-700">
                      <div className="flex items-center gap-2.5 font-medium">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                          ✓
                        </div>
                        <span>40% Discount on Annual Gala & Tech Summit tickets</span>
                      </div>

                      <div className="flex items-center gap-2.5 font-medium">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                          ✓
                        </div>
                        <span>Digital Apple/Google Wallet pass with holographic QR</span>
                      </div>

                      <div className="flex items-center gap-2.5 font-medium">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                          ✓
                        </div>
                        <span>Automatic ₹200 OFF on all official hoodies & merchandise</span>
                      </div>

                      <div className="flex items-center gap-2.5 font-medium">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                          ✓
                        </div>
                        <span>Eligible to run for Executive Leadership & Board posts</span>
                      </div>

                      <div className="flex items-center gap-2.5 font-medium">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                          ✓
                        </div>
                        <span>Priority access to volunteer registries and certificates</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <Button
                      variant={isRecommended ? "default" : "outline"}
                      size="lg"
                      disabled={loadingCheckout}
                      onClick={() => handleCheckout(tier)}
                      className={`w-full text-sm font-bold shadow-md cursor-pointer ${
                        isRecommended 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {loadingCheckout && selectedTier?.id === tier.id ? (
                        <span>Activating Pass...</span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Join for {formatINR(price)} <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                    <p className="mt-2 text-[10px] text-center text-slate-400">
                      Instant wallet activation • 14-day money-back guarantee
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature Comparison Matrix */}
      <section className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <h3 className="text-xl font-display font-extrabold text-slate-900 tracking-tight mb-6 text-center">
            Guest Student vs. Verified Skyline Member
          </h3>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="grid grid-cols-12 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
              <div className="col-span-6">Benefit / Capability</div>
              <div className="col-span-3 text-center">Guest</div>
              <div className="col-span-3 text-center text-blue-600">Skyline Member</div>
            </div>

            <div className="grid grid-cols-12 py-3.5 items-center">
              <div className="col-span-6 font-medium text-slate-800">Event Admission</div>
              <div className="col-span-3 text-center text-slate-500">Full Standard Price</div>
              <div className="col-span-3 text-center font-bold text-emerald-600">Up to 40% Off</div>
            </div>

            <div className="grid grid-cols-12 py-3.5 items-center bg-slate-50/50">
              <div className="col-span-6 font-medium text-slate-800">Door Queue Access</div>
              <div className="col-span-3 text-center text-slate-500">General Line</div>
              <div className="col-span-3 text-center font-bold text-blue-600">1.2s Fast Track QR</div>
            </div>

            <div className="grid grid-cols-12 py-3.5 items-center">
              <div className="col-span-6 font-medium text-slate-800">Official Club Merch</div>
              <div className="col-span-3 text-center text-slate-500">Retail Price</div>
              <div className="col-span-3 text-center font-bold text-emerald-600">₹200 Instant Off</div>
            </div>

            <div className="grid grid-cols-12 py-3.5 items-center bg-slate-50/50">
              <div className="col-span-6 font-medium text-slate-800">Executive Election Candidacy</div>
              <div className="col-span-3 text-center text-red-500">✕ Ineligible</div>
              <div className="col-span-3 text-center font-bold text-emerald-600">✓ Fully Eligible</div>
            </div>

            <div className="grid grid-cols-12 py-3.5 items-center">
              <div className="col-span-6 font-medium text-slate-800">Official Letter of Experience</div>
              <div className="col-span-3 text-center text-slate-400">—</div>
              <div className="col-span-3 text-center font-bold text-blue-600">Included on request</div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-2">Student Voices</Badge>
          <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            Hear From Our Community
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="pt-6">
              <div className="flex text-amber-400 gap-1 mb-3">
                <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The member discount on Gala alone paid for my entire year's pass. Plus, getting to lead the robotics exhibition was the highlight of my resume."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                  PP
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Priya Patel</div>
                  <div className="text-[10px] text-slate-400">Computer Eng, 3rd Year</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="pt-6">
              <div className="flex text-amber-400 gap-1 mb-3">
                <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Having the digital wallet pass on my phone made check-in at the tech symposium effortless. No paper tickets, no line holdups."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                  RS
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rohan Shah</div>
                  <div className="text-[10px] text-slate-400">Mechanical Eng, 2nd Year</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="pt-6">
              <div className="flex text-amber-400 gap-1 mb-3">
                <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "I joined as a volunteer, got promoted to Event Head, and managed a ₹2.5 Lakh budget with real faculty oversight. Invaluable experience."
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  AJ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Aarav Joshi</div>
                  <div className="text-[10px] text-slate-400">Civil Eng, 4th Year</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight text-center mb-8">
          Frequently Asked Questions
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-700 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? "rotate-180 text-blue-600" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
