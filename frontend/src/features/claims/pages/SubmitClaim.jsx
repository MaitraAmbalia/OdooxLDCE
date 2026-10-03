import React, { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function SubmitClaim() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      dateSpent: new Date().toISOString().split('T')[0]
    }
  });

  const amount = watch("amount", 0);
  
  // Predict route based on amount (e.g. over 2000 INR = 200000 paise goes to President)
  const isHighValue = Number(amount) > 2000;

  // Mock upload logic
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - receipts.length);
      setReceipts([...receipts, ...newFiles]);
    }
  };

  const submitClaim = useMutation({
    mutationFn: async (data) => {
      // 1. Upload files first (POST /files)
      // 2. Submit claim (POST /claims)
      console.log("Submitting claim...", { ...data, receiptsCount: receipts.length });
      return { id: "mock-claim-id" };
    },
    onSuccess: () => {
      navigate("/volunteer"); // or claim detail
    }
  });

  const onSubmit = (data) => {
    if (receipts.length === 0) {
      toast.error("Please upload at least one receipt image.");
      return;
    }
    submitClaim.mutate(data);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link to="/volunteer" className="text-sm font-medium text-[var(--color-dusk)] hover:underline mb-6 inline-block">
        &larr; Back to Volunteering
      </Link>
      
      <h1 className="text-2xl font-display font-extrabold text-[var(--color-ink)] mb-6">Submit Expense Claim</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Receipt Capture */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-4 text-center">
          <label className="block cursor-pointer">
            <span className="text-[var(--color-dusk)] font-medium block mb-2"><Camera className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Add Receipt (up to 5)</span>
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
                <button type="button" onClick={() => setReceipts(receipts.filter((_, idx) => idx !== i))} className="text-[var(--color-stop)] font-bold">&times;</button>
              </div>)}
            </div>
          )}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Amount (₹)</label>
            <input 
              type="number" 
              step="0.01" 
              {...register("amount", { required: true, min: 1 })} 
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] tabular-nums font-mono text-lg" 
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Date Spent</label>
            <input 
              type="date" 
              {...register("dateSpent", { required: true })} 
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" 
            />
          </div>
        </div>

        {/* Link / Category */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Category</label>
          <select {...register("category")} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]">
            <option value="Logistics">Logistics</option>
            <option value="Food & Bev">Food & Bev</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Description</label>
          <input 
            type="text" 
            placeholder="e.g. Paint for stage props"
            {...register("description", { required: true })} 
            className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Link to Event/Task</label>
          <select {...register("linkId")} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]">
            <option value="">-- None --</option>
            <option value="task1">Task: Build Stage (Gala)</option>
            <option value="event1">Event: Tech Gala 2026</option>
          </select>
        </div>

        {/* Route Preview */}
        {amount > 0 && (
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[6px] p-3 text-sm">
            <span className="font-semibold text-[var(--color-ink)]">Approval Route: </span>
            <span className="text-[var(--color-muted)]">
              Treasurer {isHighValue && "→ President"}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || submitClaim.isPending}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-[6px] shadow-sm text-sm font-medium text-white bg-[var(--color-dusk)] hover:bg-opacity-90 disabled:opacity-50"
        >
          {submitClaim.isPending ? "Submitting..." : "Submit Claim"}
        </button>
      </form>
    </div>
  );
}
