import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MembershipCard from "../components/MembershipCard";

export default function MyMembership() {
  const { data: membershipData, isLoading, error } = useQuery({
    queryKey: ['myMembership'],
    queryFn: async () => {
      // API endpoint: GET /memberships/me
      const res = await fetch("/api/v1/memberships/me", { credentials: "include" });
      if (res.status === 401 || res.status === 404) return null; // No membership or not logged in
      if (!res.ok) throw new Error("Failed to fetch membership");
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--color-muted)]">Loading your membership...</div>;
  }

  const membership = membershipData?.data?.current || membershipData?.data;

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:px-6 lg:max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-[var(--color-ink)]">My Membership</h1>
        {!membership && (
          <Link to="/join" className="text-sm bg-[var(--color-dusk)] text-white px-4 py-2 rounded-md hover:bg-opacity-90">
            Join Now
          </Link>
        )}
      </div>

      {!membership ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-8 text-center">
          <p className="text-[var(--color-ink)] mb-4">You are not currently a member of Skyline.</p>
          <Link to="/join" className="inline-block bg-[var(--color-dusk)] text-white px-6 py-2 rounded-md font-medium hover:bg-opacity-90">
            View Membership Tiers
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Phone-first Membership Card */}
          <section>
            <MembershipCard membership={membership} />
          </section>

          {/* History List */}
          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--color-ink)] mb-4">Membership History</h2>
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden">
              <ul className="divide-y divide-[var(--color-line)]">
                <li className="p-4 flex items-center justify-between hover:bg-[var(--color-paper)]">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">Joined Skyline</p>
                    <p className="text-sm text-[var(--color-muted)]">
                      {new Date(membership.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--color-ok)]">Paid</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
