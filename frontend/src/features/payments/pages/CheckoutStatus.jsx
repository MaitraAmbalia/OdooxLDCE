import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function CheckoutStatus() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [shouldPoll, setShouldPoll] = useState(true);

  // Poll GET /payments/:id every 2 seconds until status is PAID or FAILED
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/payments/${paymentId}`);
      if (!res.ok) throw new Error("Failed to fetch payment status");
      return res.json();
    },
    refetchInterval: shouldPoll ? 2000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const status = data?.data?.status;
    if (status === "PAID" || status === "FAILED") {
      setShouldPoll(false);
      
      // If paid, redirect based on metadata or just wait for user to click
      if (status === "PAID" && data?.data?.metadata?.type === "MEMBERSHIP") {
        setTimeout(() => {
          navigate("/me/membership");
        }, 3000); // give them 3 seconds to read success
      }
    }
  }, [data, navigate]);

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-[var(--color-surface)] py-12 px-4 shadow sm:rounded-[10px] sm:px-10 border border-[var(--color-line)] text-center">
        
        {isLoading && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-dusk)] mx-auto mb-4"></div>
            <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">Waiting for payment confirmation</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Please do not close this window...</p>
          </div>
        )}

        {error && (
          <div>
            <div className="h-12 w-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#DC2626] text-xl">!</span>
            </div>
            <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">Status Check Failed</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">We couldn't check your payment status. Your money might still be safe.</p>
            <Link to="/me" className="mt-6 inline-block text-sm font-medium text-[var(--color-dusk)] hover:underline">
              Go to Dashboard
            </Link>
          </div>
        )}

        {data && data.data?.status === "PAID" && (
          <div>
            <div className="h-12 w-12 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#059669] text-2xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-2">Payment Successful!</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Amount paid: ₹{(data.data.amountPaise / 100).toFixed(2)}
            </p>
            <p className="text-sm text-[var(--color-muted)]">Redirecting you automatically...</p>
            <Link to="/me" className="mt-6 inline-block px-4 py-2 bg-[var(--color-dusk)] text-white text-sm font-medium rounded-[6px] hover:bg-opacity-90">
              Go to Dashboard Now
            </Link>
          </div>
        )}

        {data && data.data?.status === "FAILED" && (
          <div>
            <div className="h-12 w-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#DC2626] text-2xl font-bold">✗</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-2">Payment Failed</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Reason: {data.data.failureReason || "Unknown error"}
            </p>
            <Link to="/join" className="mt-6 inline-block px-4 py-2 border border-[var(--color-dusk)] text-[var(--color-dusk)] text-sm font-medium rounded-[6px] hover:bg-[var(--color-paper)]">
              Try Again
            </Link>
          </div>
        )}

        {data && data.data?.status === "PENDING" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-wait)] mx-auto mb-4"></div>
            <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">Processing Payment</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">We're verifying your transaction with the gateway...</p>
          </div>
        )}
      </div>
    </div>
  );
}
