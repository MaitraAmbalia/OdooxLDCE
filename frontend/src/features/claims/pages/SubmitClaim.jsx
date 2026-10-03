import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info, ReceiptIndianRupee, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getJson, sendJson } from "@/lib/api";

async function uploadReceipt(file) {
  const form = new FormData();
  form.append("purpose", "RECEIPT");
  form.append("file", file);
  const response = await fetch("/api/v1/files", { method: "POST", credentials: "include", body: form });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${file.name}: ${json.error?.message || "upload failed"}`);
  return json.data.id;
}

export default function SubmitClaim() {
  usePageTitle("Submit expense claim");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [receipts, setReceipts] = useState([]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      dateSpent: new Date().toLocaleDateString("en-CA"), // local YYYY-MM-DD
      category: "REIMBURSEMENT",
      link: "",
    }
  });

  const amount = watch("amount", 0);
  const events = useQuery({ queryKey: ["events", "published"], queryFn: () => getJson("/events?limit=100") });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => getJson("/projects") });
  
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
      const receiptFileIds = await Promise.all(receipts.map(uploadReceipt));
      const [kind, linkId] = data.link.split(":");
      const json = await sendJson("/claims", {
        body: {
          amountPaise: Math.round(Number(data.amount) * 100),
          dateSpent: data.dateSpent,
          description: data.description.trim(),
          category: data.category,
          [kind === "event" ? "eventId" : "projectId"]: linkId,
          receiptFileIds,
        },
      });
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
            <div className="mt-4 text-sm text-foreground text-left space-y-2">
              {receipts.map((r, i) => <div key={i} className="flex justify-between items-center bg-muted px-3 py-1 rounded">
                <span className="truncate max-w-[200px]">{r.name}</span>
                <button type="button" onClick={() => setReceipts(receipts.filter((_, idx) => idx !== i))} className="flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/5" aria-label={`Remove ${r.name}`}><X className="size-4" /></button>
              </div>)}
            </div>
          )}
          <p className="mt-3 flex items-start justify-center gap-1.5 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" />JPG, PNG, WebP or PDF, up to 5 MB each. Only you and finance reviewers can see them.</p>
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
              max={new Date().toLocaleDateString("en-CA")}
              {...register("dateSpent", { required: true })} 
            />
          </div>
        </div>

        {/* Link / Category */}
        <div>
          <label htmlFor="claim-link" className="mb-1.5 block text-sm font-medium">Spent for</label>
          <select id="claim-link" aria-invalid={!!errors.link} {...register("link", { required: "Choose the event or project this was for" })} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Choose an event or project…</option>
            <optgroup label="Events">{(events.data?.data || []).map((e) => <option key={e.id} value={`event:${e.id}`}>{e.title}</option>)}</optgroup>
            <optgroup label="Projects">{(projects.data?.data || []).map((p) => <option key={p.id} value={`project:${p.id}`}>{p.name}</option>)}</optgroup>
          </select>
          {errors.link && <p className="mt-1.5 text-sm text-destructive">{errors.link.message}</p>}
        </div>

        <div>
          <label htmlFor="claim-category" className="mb-1.5 block text-sm font-medium">Type</label>
          <select id="claim-category" {...register("category")} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="REIMBURSEMENT">Reimbursement (I paid out of pocket)</option>
            <option value="PURCHASE">Supplies purchase</option>
            <option value="OTHER">Other</option>
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
