import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info, ReceiptIndianRupee, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SubmitClaim() {
  usePageTitle("Submit expense claim");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [receipts, setReceipts] = useState([]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      dateSpent: new Date().toISOString().split('T')[0]
    }
  });

  const amount = watch("amount", 0);
  
  // Predict route based on amount (e.g. over 2000 INR = 200000 paise goes to President)
  const isHighValue = Number(amount) > 2000;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - receipts.length);
      setReceipts([...receipts, ...newFiles]);
    }
  };

  const submitClaim = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/v1/claims", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise: Math.round(Number(data.amount) * 100),
          dateSpent: data.dateSpent,
          description: data.description,
          category: data.category,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not submit claim");
      return json.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success("Expense claim submitted.");
      navigate("/volunteer");
    },
    onError: (error) => toast.error(error.message || "Could not submit claim."),
  });

  const onSubmit = (data) => {
    submitClaim.mutate(data);
  };

  return (
    <div className="page-container max-w-xl py-12 sm:py-16">
      <Link to="/volunteer" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" /> Volunteer space
      </Link>

      <p className="mb-2 text-sm font-medium text-primary">Reimbursement</p>
      <h1 className="mb-8 font-display text-4xl font-semibold tracking-tight">Submit an expense claim</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Receipt Capture */}
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <label className="block cursor-pointer">
            <span className="mb-2 flex items-center justify-center gap-2 font-medium text-primary"><ReceiptIndianRupee className="size-5" /> Select receipts (up to 5)</span>
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              capture="environment" 
              multiple 
              onChange={handleFileChange} 
              className="hidden" 
              disabled={receipts.length >= 5}
            />
          </label>
          {receipts.length > 0 && (
            <div className="mt-4 text-sm text-[var(--color-ink)] text-left space-y-2">
              {receipts.map((r, i) => <div key={i} className="flex justify-between items-center bg-[var(--color-paper)] px-3 py-1 rounded">
                <span className="truncate max-w-[200px]">{r.name}</span>
                <button type="button" onClick={() => setReceipts(receipts.filter((_, idx) => idx !== i))} className="flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/5" aria-label={`Remove ${r.name}`}><X className="size-4" /></button>
              </div>)}
            </div>
          )}
          <p className="mt-3 flex items-start justify-center gap-1.5 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" />Receipt upload persistence is not connected yet; keep the originals for review.</p>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="claim-amount" className="mb-1.5 block text-sm font-medium">Amount (₹)</label>
            <Input
              id="claim-amount"
              type="number" 
              step="0.01" 
              {...register("amount", { required: true, min: 1 })}
              className="font-mono text-lg tabular-nums"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="claim-date" className="mb-1.5 block text-sm font-medium">Date spent</label>
            <Input
              id="claim-date"
              type="date" 
              {...register("dateSpent", { required: true })} 
            />
          </div>
        </div>

        {/* Link / Category */}
        <div>
          <label htmlFor="claim-category" className="mb-1.5 block text-sm font-medium">Category</label>
          <select id="claim-category" {...register("category")} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="Logistics">Logistics</option>
            <option value="Food & Bev">Food & Bev</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="claim-description" className="mb-1.5 block text-sm font-medium">Description</label>
          <Input
            id="claim-description"
            type="text" 
            placeholder="e.g. Paint for stage props"
            {...register("description", { required: true })} 
          />
        </div>

        {/* Route Preview */}
        {amount > 0 && (
          <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
            <span className="font-semibold">Approval route: </span>
            <span className="text-muted-foreground">
              Treasurer {isHighValue && "→ President"}
            </span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || submitClaim.isPending}
          className="w-full"
          size="lg"
        >
          {submitClaim.isPending ? "Submitting…" : "Submit claim"}
        </Button>
      </form>
    </div>
  );
}
