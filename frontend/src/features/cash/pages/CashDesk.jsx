import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function CashDesk() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("record"); // record | history

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      purpose: "MEMBERSHIP", // MEMBERSHIP or EVENT_TICKET
    }
  });

  const recordCash = useMutation({
    mutationFn: async (data) => {
      // API endpoint: POST /cash-collections
      console.log("Recording cash collection:", data);
      return { success: true };
    },
    onSuccess: () => {
      alert("Cash recorded successfully!");
      reset();
      queryClient.invalidateQueries({ queryKey: ['cashCollections', 'me'] });
    }
  });

  const onSubmit = (data) => {
    recordCash.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-paper)] flex flex-col md:flex-row">
      {/* Sidebar / Top Nav for Cash Desk (Focus App) */}
      <div className="bg-[var(--color-ink)] text-white w-full md:w-64 p-6 flex flex-row md:flex-col justify-between shadow-lg z-10">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight mb-1">Cash Desk</h1>
          <p className="text-xs text-gray-400 hidden md:block">Skyline Student Association</p>
          
          <div className="mt-8 flex md:flex-col gap-2">
            <button 
              onClick={() => setActiveTab("record")}
              className={`text-left px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${activeTab === 'record' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Record Cash
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`text-left px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              My Collections
            </button>
          </div>
        </div>
        
        <div className="mt-auto">
          <Link to="/volunteer" className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
            &larr; Exit Desk
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          
          {activeTab === 'record' && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-6">New Collection</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Purpose</label>
                  <div className="flex gap-4">
                    <label className="flex-1 border border-[var(--color-line)] rounded-[6px] p-3 flex items-center cursor-pointer hover:bg-[var(--color-paper)]">
                      <input type="radio" value="MEMBERSHIP" {...register("purpose")} className="mr-3" />
                      <span className="text-sm font-medium">Membership Dues</span>
                    </label>
                    <label className="flex-1 border border-[var(--color-line)] rounded-[6px] p-3 flex items-center cursor-pointer hover:bg-[var(--color-paper)]">
                      <input type="radio" value="EVENT_TICKET" {...register("purpose")} className="mr-3" />
                      <span className="text-sm font-medium">Event Ticket</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Payer (Name or Student ID)</label>
                  <input 
                    type="text" 
                    {...register("payerInfo", { required: true })} 
                    className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" 
                    placeholder="e.g. Aarav Shah / 2026101"
                  />
                  {errors.payerInfo && <p className="mt-1 text-xs text-[var(--color-stop)]">Required</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Amount Collected (₹)</label>
                  <input 
                    type="number" 
                    step="1"
                    {...register("amount", { required: true, min: 1 })} 
                    className="w-full px-3 py-3 border border-[var(--color-line)] rounded-[6px] font-mono text-xl tabular-nums text-[var(--color-ink)]" 
                    placeholder="0"
                  />
                  {errors.amount && <p className="mt-1 text-xs text-[var(--color-stop)]">Enter valid amount</p>}
                </div>

                <div className="bg-[var(--color-paper)] p-4 rounded-[6px] border border-[var(--color-line)] text-sm">
                  <p className="font-semibold text-[var(--color-ink)] mb-1">Warning</p>
                  <p className="text-[var(--color-muted)]">Ensure you have physically received this exact cash amount before recording. This entry will be linked to your account for Treasurer verification.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || recordCash.isPending}
                  className="w-full py-3 px-4 rounded-[6px] shadow-sm text-base font-bold text-white bg-[var(--color-dusk)] hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {recordCash.isPending ? "Recording..." : "Record Cash Receipt"}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-6">Today's Collections</h2>
              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden">
                <div className="p-4 bg-[var(--color-paper)] border-b border-[var(--color-line)] flex justify-between items-center">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">Total Handover Expected</span>
                  <span className="text-xl font-mono font-bold text-[var(--color-ink)] tabular-nums">₹0.00</span>
                </div>
                <div className="p-8 text-center text-[var(--color-muted)] text-sm">
                  No collections recorded today yet.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
