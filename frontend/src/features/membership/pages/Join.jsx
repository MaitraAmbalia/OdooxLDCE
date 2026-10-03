import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function Join() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState(null);

  // Fetch tiers
  const { data: tiers, isLoading } = useQuery({
    queryKey: ['membershipTiers'],
    queryFn: async () => {
      // API endpoint: GET /membership-tiers
      const res = await fetch("/api/v1/membership-tiers");
      if (!res.ok) throw new Error("Failed to fetch tiers");
      return res.json();
    }
  });

  const handleCheckout = async () => {
    if (!selectedTier) return;
    
    // API endpoint: POST /memberships/checkout
    console.log("Initiating checkout for tier:", selectedTier.id);
    
    // Normally this returns a paymentId or redirect url
    // For now, simulate success redirect to mock payment or checkout status
    navigate(`/checkout/status/mock-payment-${selectedTier.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-display font-extrabold text-[var(--color-ink)] sm:text-4xl">
          Become a Member
        </h2>
        <p className="mt-4 text-xl text-[var(--color-muted)] max-w-2xl mx-auto">
          Join the Skyline Student Association to get exclusive discounts, access to the volunteer registry, and run for leadership posts.
        </p>
      </div>

      <div className="mt-16 sm:mt-20">
        {isLoading ? (
          <div className="text-center text-[var(--color-muted)]">Loading membership tiers...</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tiers?.data?.map((tier) => (
              <div 
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`rounded-[10px] p-8 border cursor-pointer transition-all ${
                  selectedTier?.id === tier.id 
                    ? "border-[var(--color-dusk)] ring-2 ring-[var(--color-dusk)] bg-[var(--color-surface)] shadow-lg" 
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-muted)]"
                }`}
              >
                <h3 className="text-2xl font-display font-semibold text-[var(--color-ink)]">{tier.name}</h3>
                <p className="mt-4 text-sm text-[var(--color-muted)] h-12">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-display font-bold text-[var(--color-ink)] tracking-tight tabular-nums">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tier.pricePaise / 100)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-muted)]">/ year</span>
                </div>
                
                <ul className="mt-8 space-y-3 text-sm leading-6 text-[var(--color-ink)]">
                  <li className="flex gap-x-3">
                    <span className="text-[var(--color-ok)]">✓</span> Exclusive event discounts
                  </li>
                  <li className="flex gap-x-3">
                    <span className="text-[var(--color-ok)]">✓</span> Digital membership card
                  </li>
                  <li className="flex gap-x-3">
                    <span className="text-[var(--color-ok)]">✓</span> Eligible for leadership posts
                  </li>
                </ul>

                <button
                  onClick={handleCheckout}
                  className={`mt-8 block w-full rounded-[6px] px-3 py-2 text-center text-sm font-medium leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    selectedTier?.id === tier.id
                      ? "bg-[var(--color-dusk)] text-white hover:bg-opacity-90"
                      : "bg-[var(--color-paper)] text-[var(--color-dusk)] border border-[var(--color-dusk)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {selectedTier?.id === tier.id ? "Proceed to checkout" : "Select tier"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
