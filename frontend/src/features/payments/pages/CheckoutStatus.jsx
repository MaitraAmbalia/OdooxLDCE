import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, CircleAlert, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";

// Where each purpose lands after payment, and where "Try again" goes.
const DESTINATIONS = {
  MEMBERSHIP: { done: "/me/membership", label: "membership", retry: "/join" },
  MERCH_ORDER: { done: "/me/orders", label: "orders", retry: "/shop" },
  TICKET: { done: "/me/tickets", label: "tickets", retry: "/events" },
};

// Razorpay Checkout script, loaded once on first use.
let razorpayScript;
function loadRazorpay() {
  razorpayScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => { razorpayScript = undefined; reject(new Error("Could not load Razorpay")); };
    document.body.appendChild(script);
  });
  return razorpayScript;
}

export default function CheckoutStatus() {
  usePageTitle("Payment status");
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [shouldPoll, setShouldPoll] = useState(true);
  const autoOpened = useRef(false);

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

  const payment = data?.data;
  const destination = DESTINATIONS[payment?.purpose] ?? DESTINATIONS.MEMBERSHIP;
  const awaitingPayment = payment?.status === "CREATED" || payment?.status === "PENDING";

  const openRazorpay = async () => {
    try {
      await loadRazorpay();
    } catch {
      toast.error("Could not load the payment window. Check your connection and try again.");
      return;
    }
    const checkout = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.gatewayOrderId,
      amount: payment.amountPaise,
      currency: payment.currency,
      name: "Skyline Student Association",
      theme: { color: "#2563eb" },
      // The server re-checks the signature before marking the payment PAID.
      handler: async (response) => {
        try {
          const res = await fetch(`/api/v1/payments/${paymentId}/confirm`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gatewayPaymentId: response.razorpay_payment_id, gatewaySignature: response.razorpay_signature }),
          });
          if (!res.ok) throw new Error();
        } catch {
          toast.error("Payment received but not yet confirmed. This page will update shortly.");
        }
        refetch();
      },
    });
    checkout.on("payment.failed", (response) => toast.error(response.error?.description || "Payment failed. You can try again."));
    checkout.open();
  };

  // Open the Razorpay window straight away the first time; the button stays for retries.
  useEffect(() => {
    if (!autoOpened.current && awaitingPayment && payment.provider === "RAZORPAY") {
      autoOpened.current = true;
      openRazorpay();
    }
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
          navigate(destination.done);
        }, 2000);
        return () => window.clearTimeout(redirectTimer);
      }
    }
  }, [data, navigate, destination.done]);

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
            <p className="text-sm text-muted-foreground">Taking you to your {destination.label}…</p>
            <Button asChild className="mt-6"><Link to={destination.done}>View {destination.label}</Link></Button>
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
            <Button asChild variant="outline"><Link to={destination.retry}>Try again</Link></Button>
          </div>
        )}

        {data && (data.data?.status === "PENDING" || data.data?.status === "CREATED") && (
          <div>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Clock3 className="size-6" /></div>
            <h1 className="font-display text-2xl font-semibold">Payment pending</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {payment.provider === "RAZORPAY" ? "Complete the payment in the Razorpay window. This page updates automatically." : "Waiting for confirmation from the payment provider. This page updates automatically."}
            </p>
            {payment.provider === "RAZORPAY" ? (
              <Button onClick={openRazorpay} className="mt-6">Pay ₹{(payment.amountPaise / 100).toFixed(2)}</Button>
            ) : null}
            {import.meta.env.DEV && payment.provider === "MOCK" ? <Button
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
