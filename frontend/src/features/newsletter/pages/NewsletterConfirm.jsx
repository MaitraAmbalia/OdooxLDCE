import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NewsletterConfirm() {
  usePageTitle("Confirm Subscription");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided in the link.");
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`/api/v1/newsletter/confirm/${token}`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Verification failed");
        setStatus("success");
        setMessage(json.data?.message || "Subscription confirmed successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Failed to confirm subscription.");
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <h1 className="font-display text-2xl font-semibold">Confirming subscription...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="font-display text-2xl font-semibold">You're Subscribed!</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="mt-4 flex w-full flex-col gap-2">
              <Button asChild className="w-full gap-2">
                <Link to="/events">
                  Explore Events <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="size-8" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Verification Problem</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/">Return to Skyline Home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
