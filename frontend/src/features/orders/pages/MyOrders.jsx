import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingBag, Package, CheckCircle2, Clock, 
  MapPin, ArrowRight, ExternalLink, QrCode, ShoppingBag as ShoppingBagIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function MyOrders() {
  usePageTitle("My orders");
  const { data: ordersData, isPending, isError, refetch } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    }
  });

  const orders = ordersData?.data || [];

  if (isPending) {
    return (
      <div className="page-container max-w-4xl py-12" role="status" aria-label="Loading orders">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-48 rounded-3xl mb-4" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">From cart to campus</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            My merchandise orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track fulfillment status and pickup instructions for your campus merch.
          </p>
        </div>

        <Link to="/shop">
          <Button variant="outline" className="bg-card">
            <ShoppingBag aria-hidden="true" /> Browse shop
          </Button>
        </Link>
      </div>

      {isError ? (
        <ContentState error title="Your orders aren’t available right now." description="We couldn’t load your order history. Try again in a moment." action={refetch} />
      ) : orders.length === 0 ? (
        <ContentState icon={ShoppingBagIcon} to="/shop" actionLabel="Visit the shop" title="No orders yet." description="When you order Skyline merchandise, pickup progress and details will appear here." />
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isReady = order.status === "READY";
            const isCollected = order.status === "COLLECTED";
            const orderDate = new Date(order.createdAt || Date.now());

            return (
              <Card key={order.id} className="overflow-hidden rounded-2xl border-border shadow-none">
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/40 p-5 text-xs">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">Date placed</div>
                    <div className="font-semibold">
                      {orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">Total</div>
                    <div className="font-display text-sm font-semibold tabular-nums">
                      {formatINR(order.totalPaise / 100)}
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">Order ID</div>
                    <div className="font-mono text-muted-foreground">
                      {String(order.id).slice(0, 10).toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <Badge variant={isCollected ? "secondary" : isReady ? "success" : order.status === "PENDING_PAYMENT" ? "warning" : "primary"}>
                      {order.status === "PENDING_PAYMENT" ? "Payment pending" : order.status || "CONFIRMED"}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Items List */}
                  <div className="md:col-span-7 space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Items
                    </h4>
                    
                    <div className="space-y-3">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-border pb-3 text-xs last:border-0 last:pb-0">
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              Size: {item.variant} • Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="font-display font-semibold tabular-nums">
                            {formatINR(((item.unitPricePaise || item.pricePaise || 0) * (item.quantity || 1)) / 100)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pickup Progress & Instructions */}
                  <div className="space-y-4 md:col-span-5 md:border-l md:border-border md:pl-6">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Pickup status
                    </h4>

                    {order.status === "PENDING_PAYMENT" ? (
                      <div className="space-y-3 rounded-xl border border-warning/30 bg-warning-soft/70 p-4 text-xs text-warning">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Clock className="size-4 text-warning" /> Payment pending
                        </div>
                        <p className="text-[11px] text-warning/90 leading-relaxed">
                          Complete payment to confirm your pickup reservation.
                        </p>
                        {order.paymentId && (
                          <Button asChild size="sm" className="w-full">
                            <Link to={`/checkout/status/${order.paymentId}`}>Complete payment &rarr;</Link>
                          </Button>
                        )}
                      </div>
                    ) : isReady ? (
                      <div className="space-y-2 rounded-xl border border-[#b9d1c3] bg-[#e4eee8] p-4 text-xs text-[#345d4a]">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="size-4" /> Ready for pickup
                        </div>
                        <p className="text-[11px] text-success/80 leading-relaxed">
                          Show this Order ID at Student Center Desk B between 10:00 AM – 04:30 PM.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 rounded-xl border border-border bg-secondary/50 p-4 text-xs text-secondary-foreground">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Package className="size-4 text-primary" /> In production
                        </div>
                        <p className="text-[11px] text-primary/80 leading-relaxed">
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
