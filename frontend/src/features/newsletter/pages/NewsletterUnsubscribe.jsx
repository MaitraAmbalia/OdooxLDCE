import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NewsletterUnsubscribe() {
  usePageTitle("Unsubscribe");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No unsubscribe token was provided.");
      return;
    }

    const unsub = async () => {
      try {
        const res = await fetch(`/api/v1/newsletter/unsubscribe/${token}`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Unsubscribe failed");
        setStatus("success");
        setMessage(json.data?.message || "You have been unsubscribed.");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Failed to unsubscribe.");
      }
    };

    unsub();
  }, [token]);

  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <h1 className="font-display text-2xl font-semibold">Updating preferences...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we process your request.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">
              You will no longer receive broadcast emails from Skyline. You can resubscribe anytime on the website.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/">Return to Skyline Home</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="size-8" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Unable to Unsubscribe</h1>
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
