import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, CircleAlert, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";

export default function CheckoutStatus() {
  usePageTitle("Payment status");
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [shouldPoll, setShouldPoll] = useState(true);

  // Poll GET /payments/:id every 2 seconds until status is PAID or FAILED
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['payments', paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/payments/${paymentId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payment status");
      return res.json();
    },
    refetchInterval: shouldPoll ? 2000 : false,
    refetchIntervalInBackground: true,
  });

  const handleSimulatePayment = async () => {
    try {
      const response = await fetch(`/api/v1/payments/${paymentId}/mock-complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Could not complete demo payment");
      await refetch();
    } catch {
      toast.error("Could not complete the demo payment.");
    }
  };

  useEffect(() => {
    const status = data?.data?.status;
    if (status === "PAID" || status === "FAILED") {
      setShouldPoll(false);
      
      // If paid, redirect to membership or tickets after a short display
      if (status === "PAID") {
        const redirectTimer = window.setTimeout(() => {
          navigate("/me/membership");
        }, 2000);
        return () => window.clearTimeout(redirectTimer);
      }
    }
  }, [data, navigate]);

  return (
    <section className="page-container flex min-h-[66vh] flex-col justify-center py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-10">
        
        {isPending && (
          <div>
            <Skeleton className="mx-auto size-12 rounded-full" />
            <Skeleton className="mx-auto mt-5 h-7 w-72" />
            <p className="mt-3 text-sm text-muted-foreground">Checking payment status…</p>
          </div>
        )}

        {isError && (
          <div>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <CircleAlert className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold">We couldn’t confirm the payment.</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">No new charge will be attempted. Retry the status check or return to your account.</p>
            <div className="mt-6 flex justify-center gap-3"><Button onClick={() => refetch()}>Check again</Button><Button asChild variant="outline"><Link to="/me">My account</Link></Button></div>
          </div>
        )}

        {data && data.data?.status === "PAID" && (
          <div>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#e4eee8] text-[#345d4a]">
              <Check className="size-6" />
            </div>
            <h1 className="mb-2 font-display text-3xl font-semibold">Payment complete.</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Amount paid: ₹{(data.data.amountPaise / 100).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Taking you to your membership…</p>
            <Button asChild className="mt-6"><Link to="/me/membership">View membership</Link></Button>
          </div>
        )}

        {data && data.data?.status === "FAILED" && (
          <div>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <CircleAlert className="size-6" />
            </div>
            <h1 className="mb-2 font-display text-3xl font-semibold">Payment didn’t go through.</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Reason: {data.data.failureReason || "Unknown error"}
            </p>
            <Button asChild variant="outline"><Link to="/join">Try again</Link></Button>
          </div>
        )}

        {data && (data.data?.status === "PENDING" || data.data?.status === "CREATED") && (
          <div>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Clock3 className="size-6" /></div>
            <h1 className="font-display text-2xl font-semibold">Payment pending</h1>
            <p className="mt-2 text-sm text-muted-foreground">Waiting for confirmation from the payment provider. This page updates automatically.</p>
            {import.meta.env.DEV ? <Button
              onClick={handleSimulatePayment}
              variant="outline"
              className="mt-6"
            >
              Complete demo payment
            </Button> : null}
          </div>
        )}
      </div>
    </section>
  );
}
