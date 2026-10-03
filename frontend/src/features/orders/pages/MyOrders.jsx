import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingBag, Package, CheckCircle2, Clock, 
  MapPin, ArrowRight, ExternalLink, QrCode 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";

export default function MyOrders() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders/me");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    }
  });

  const orders = ordersData?.data || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-48 rounded-3xl mb-4" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Merchandise Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track fulfillment status and pickup instructions for your campus merch.
          </p>
        </div>

        <Link to="/shop">
          <Button variant="outline" size="sm" className="bg-white border-slate-300 text-xs shadow-2xs">
            <ShoppingBag className="w-3.5 h-3.5 mr-1 text-blue-600" /> Browse Catalog
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-slate-900">
            No merchandise orders found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            You haven't ordered any club apparel yet. Skyline members get up to ₹200 off hoodies and tees.
          </p>
          <div className="mt-6">
            <Link to="/shop">
              <Button variant="gold" size="md">
                Visit Merch Store &rarr;
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isReady = order.status === "READY";
            const isCollected = order.status === "COLLECTED";
            const orderDate = new Date(order.createdAt || Date.now());

            return (
              <Card key={order.id} className="rounded-3xl border-slate-200/90 shadow-xs overflow-hidden">
                {/* Order Top Bar */}
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="text-[11px] uppercase font-mono text-slate-400">Date Placed</div>
                    <div className="font-semibold text-slate-800">
                      {orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase font-mono text-slate-400">Total Amount</div>
                    <div className="font-display font-black text-slate-900 text-sm tabular-nums">
                      {formatINR(order.totalPaise / 100)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase font-mono text-slate-400">Order ID</div>
                    <div className="font-mono text-slate-600">
                      {String(order.id).slice(0, 10).toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <Badge variant={isCollected ? "secondary" : isReady ? "success" : "primary"}>
                      {order.status || "CONFIRMED"}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Items List */}
                  <div className="md:col-span-7 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Purchased Items
                    </h4>
                    
                    <div className="space-y-3">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              Size: {item.variant} • Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="font-display font-bold text-slate-900 tabular-nums">
                            {formatINR((item.pricePaise * item.quantity) / 100)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pickup Progress & Instructions */}
                  <div className="md:col-span-5 md:border-l md:border-slate-100 md:pl-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Fulfillment Milestone
                    </h4>

                    {isReady ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Ready for Counter Collection
                        </div>
                        <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                          Show this Order ID at Student Center Desk B between 10:00 AM – 04:30 PM.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-blue-950 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-blue-800">
                          <Package className="w-4 h-4 text-blue-600" />
                          Batch In Production
                        </div>
                        <p className="text-[11px] text-blue-900/80 leading-relaxed">
                          Your order is being manufactured and printed. You will receive an alert once sorted for pickup.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
