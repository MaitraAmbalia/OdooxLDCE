import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PackageCheck, Search, PackageCheck as PackageCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const FILTERS = [
  { id: "PAID", label: "To pack" },
  { id: "READY", label: "Ready for pickup" },
  { id: "COLLECTED", label: "Collected" },
];

export default function FulfilmentQueue() {
  usePageTitle("Order fulfilment");
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("PAID");

  const { data: ordersData, isPending, isError, refetch } = useQuery({
    queryKey: ["orders", "queue", { status: filter }],
    queryFn: async () => {
      const response = await fetch("/api/v1/orders?status=" + filter + "&limit=50", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch orders");
      return json;
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await fetch("/api/v1/orders/" + orderId + "/status", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not update order");
      return json.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "queue"] });
      toast.success(variables.status === "READY" ? "Order marked ready for pickup." : "Order marked as collected.");
    },
    onError: (error) => toast.error(error.message || "Could not update order."),
  });

  const orders = ordersData?.data || [];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleOrders = normalizedSearch ? orders.filter((order) => {
    const searchable = [order.id, order.user?.name, order.user?.studentId].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(normalizedSearch);
  }) : orders;

  return (
    <div className="page-container py-12 sm:py-16">
      <div><p className="mb-2 text-sm font-medium text-primary">Merchandise operations</p><h1 className="font-display text-4xl font-semibold tracking-tight">Order fulfilment</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Move paid orders through packing and confirm each student handover.</p></div>

      <div className="mt-8 rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex overflow-x-auto rounded-lg bg-secondary p-1" role="tablist" aria-label="Order status">
            {FILTERS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={"min-h-10 whitespace-nowrap rounded-md px-4 text-sm font-medium transition " + (filter === item.id ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}
          </div>
          <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search order or student" className="pl-9" aria-label="Search orders" /></div>
        </div>

        {isPending ? (
          <div className="space-y-3 p-5" role="status" aria-label="Loading orders"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
        ) : isError ? (
          <div className="p-5"><ContentState error title="The fulfilment queue isn’t available." description="We couldn’t load these orders." action={refetch} /></div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-5"><ContentState icon={PackageCheckIcon} title={searchTerm ? "No orders match your search." : "This queue is clear."} description={searchTerm ? "Try an order number, student name, or student ID." : "Orders will appear here when they reach this stage."} /></div>
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {visibleOrders.map((order) => <article key={order.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{filter === "PAID" ? "To pack" : filter === "READY" ? "Ready" : "Collected"}</span></div><p className="mt-4 font-medium">{order.user?.name || "Customer"}</p><p className="mt-1 text-xs text-muted-foreground">{order.user?.studentId || "Student ID unavailable"}</p><ul className="mt-4 space-y-1 text-sm">{(order.items || []).map((item) => <li key={item.id}><strong>{item.quantity}×</strong> {item.name}<span className="text-muted-foreground"> · {item.variant}</span></li>)}</ul><OrderAction order={order} mutation={updateOrderMutation} /></article>)}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-border"><thead className="bg-secondary/40"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Order</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Customer</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Items</th><th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Action</th></tr></thead><tbody className="divide-y divide-border">{visibleOrders.map((order) => <tr key={order.id} className="transition-colors hover:bg-secondary/30"><td className="whitespace-nowrap px-6 py-4"><p className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></td><td className="whitespace-nowrap px-6 py-4"><p className="text-sm font-medium">{order.user?.name || "Customer"}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{order.user?.studentId || "ID unavailable"}</p></td><td className="px-6 py-4"><ul className="space-y-1 text-sm">{(order.items || []).map((item) => <li key={item.id}><strong>{item.quantity}×</strong> {item.name}<span className="text-muted-foreground"> · {item.variant}</span></li>)}</ul></td><td className="whitespace-nowrap px-6 py-4 text-right"><OrderAction order={order} mutation={updateOrderMutation} compact /></td></tr>)}</tbody></table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrderAction({ order, mutation, compact = false }) {
  if (order.status === "COLLECTED") return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" aria-hidden="true" /> Complete</span>;
  const nextStatus = order.status === "PAID" ? "READY" : "COLLECTED";
  return <Button size={compact ? "sm" : "default"} className={compact ? "" : "mt-5 w-full"} disabled={mutation.isPending} onClick={() => mutation.mutate({ orderId: order.id, status: nextStatus })}><PackageCheck aria-hidden="true" />{nextStatus === "READY" ? "Mark ready" : "Confirm handover"}</Button>;
}
