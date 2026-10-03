import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

export default function EventProposalStepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      tickets: [],
      budgetLines: []
    }
  });

  // Watch for capacity meter
  const capacity = watch("capacity", 0);
  const tickets = watch("tickets", []);
  const allocatedQuotas = tickets.reduce((sum, t) => sum + (Number(t.quota) || 0), 0);

  // Mock Mutation for autosave / submit
  const submitProposal = useMutation({
    mutationFn: async (data) => {
      // API endpoint: POST /events (and PATCH /events/:id for drafts)
      console.log("Submitting proposal...", data);
      // Mock success
      return { id: "mock-event-id" };
    },
    onSuccess: () => {
      navigate("/manage/events");
    }
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = (data) => {
    if (currentStep < 5) {
      // In a real app, autosave here
      nextStep();
    } else {
      submitProposal.mutate(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/manage/events" className="text-sm font-medium text-[var(--color-dusk)] hover:underline">
          &larr; Back to Pipeline
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)] mt-4">New Event Proposal</h1>
        <div className="flex gap-2 mt-6">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className={`flex-1 h-2 rounded-full ${currentStep >= step ? 'bg-[var(--color-dusk)]' : 'bg-[var(--color-line)]'}`} />
          ))}
        </div>
        <p className="text-sm text-[var(--color-muted)] mt-2">
          Step {currentStep} of 5: {
            currentStep === 1 ? 'Basics' : 
            currentStep === 2 ? 'When & Where' : 
            currentStep === 3 ? 'Tickets' : 
            currentStep === 4 ? 'Budget & Logistics' : 'Review & Submit'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 sm:p-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Event Title</label>
              <input type="text" {...register("title", { required: true })} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Category</label>
              <select {...register("category")} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]">
                <option value="Social">Social</option>
                <option value="Academic">Academic</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Description</label>
              <textarea rows={5} {...register("description", { required: true })} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Start Date & Time</label>
                <input type="datetime-local" {...register("startDate", { required: true })} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">End Date & Time</label>
                <input type="datetime-local" {...register("endDate")} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Venue</label>
              <input type="text" {...register("venue", { required: true })} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Total Capacity</label>
              <input type="number" {...register("capacity", { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-[var(--color-paper)] p-4 rounded-[6px] flex justify-between items-center border border-[var(--color-line)]">
              <span className="font-medium text-[var(--color-ink)]">Capacity Allocation</span>
              <span className={`font-mono font-bold ${allocatedQuotas > capacity ? 'text-[var(--color-stop)]' : 'text-[var(--color-ok)]'}`}>
                Quotas {allocatedQuotas} / {capacity || 0} capacity
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted)]">Use standard ticket builder here to add arrays of tickets.</p>
            {/* Note: In a real implementation, use useFieldArray to add/remove tickets dynamically */}
            <div className="p-4 border border-[var(--color-line)] border-dashed rounded-[6px] text-center">
              <button type="button" className="text-[var(--color-dusk)] font-medium">+ Add Ticket Type</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="font-medium text-[var(--color-ink)]">Estimated Budget</h3>
            <p className="text-sm text-[var(--color-muted)]">Use line-item builder here for expenses.</p>
            <div className="p-4 border border-[var(--color-line)] border-dashed rounded-[6px] text-center mb-6">
              <button type="button" className="text-[var(--color-dusk)] font-medium">+ Add Expense Line</button>
            </div>

            <h3 className="font-medium text-[var(--color-ink)] mt-8">Logistics</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Volunteers Needed</label>
              <input type="number" {...register("volunteersNeeded")} className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px]" />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-[var(--color-ink)]">Review Proposal</h3>
            <div className="bg-[var(--color-paper)] p-6 rounded-[6px] space-y-4 text-sm">
              <p><strong>Title:</strong> {watch("title")}</p>
              <p><strong>Category:</strong> {watch("category")}</p>
              <p><strong>Venue:</strong> {watch("venue")}</p>
              <p><strong>Capacity:</strong> {watch("capacity")}</p>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              Once submitted, this will be sent to your Mentor for approval. You cannot edit the capacity or budget after it is approved.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--color-line)] flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-[var(--color-line)] rounded-[6px] text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[var(--color-dusk)] text-white rounded-[6px] text-sm font-medium hover:bg-opacity-90"
          >
            {currentStep === 5 ? "Submit for approval" : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
