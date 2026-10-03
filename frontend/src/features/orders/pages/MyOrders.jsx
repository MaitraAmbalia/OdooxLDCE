import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function MyOrders() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      // API endpoint: GET /orders/me
      const res = await fetch("/api/v1/orders/me");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    }
  });

  const orders = ordersData?.data || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">My Orders</h1>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center py-12 text-[var(--color-muted)]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px]">
            <p className="text-[var(--color-muted)] mb-4">You haven't ordered any merch yet.</p>
            <Link to="/shop" className="text-[var(--color-dusk)] hover:underline font-medium">Visit the Shop</Link>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
            <div className="bg-[var(--color-paper)] p-4 border-b border-[var(--color-line)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Order Placed</p>
                <p className="font-medium text-[var(--color-ink)]">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Total</p>
                <p className="font-medium text-[var(--color-ink)]">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.totalPaise / 100)}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Order ID</p>
                <p className="font-mono font-medium text-[var(--color-ink)]">{order.id}</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Items */}
              <div>
                <h3 className="font-semibold text-[var(--color-ink)] mb-4">Items</h3>
                <ul className="space-y-4">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between items-start border-b border-[var(--color-line)] pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">{item.name}</p>
                        <p className="text-sm text-[var(--color-muted)] mt-1">Size: {item.variant} &times; {item.quantity}</p>
                      </div>
                      <p className="font-medium text-[var(--color-ink)]">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((item.pricePaise * item.quantity) / 100)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline */}
              <div className="md:border-l border-[var(--color-line)] md:pl-8">
                <h3 className="font-semibold text-[var(--color-ink)] mb-4">Status</h3>
                
                <div className="space-y-6">
                  {/* PENDING_PAYMENT / PAID */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-[var(--color-ok)] rounded-full"></div>
                      <div className="w-0.5 h-10 bg-[var(--color-ok)] my-1"></div>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">Order Confirmed</p>
                      {order.history.find(h => h.status === 'PAID') && (
                        <p className="text-xs text-[var(--color-muted)] mt-1">
                          {new Date(order.history.find(h => h.status === 'PAID').time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* READY */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${['READY', 'COLLECTED'].includes(order.status) ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-line)]'}`}></div>
                      <div className={`w-0.5 h-10 my-1 ${order.status === 'COLLECTED' ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-line)]'}`}></div>
                    </div>
                    <div>
                      <p className={`font-medium ${['READY', 'COLLECTED'].includes(order.status) ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>Ready for Pickup</p>
                      {order.status === 'READY' && (
                        <div className="mt-2 bg-[var(--color-paper)] p-3 rounded-[6px] border border-[var(--color-info)]">
                          <p className="text-sm font-bold text-[var(--color-info)]">Action Required</p>
                          <p className="text-xs mt-1">Show this Order ID at the Student Union desk between 10 AM - 4 PM.</p>
                        </div>
                      )}
                      {order.status === 'COLLECTED' && order.history.find(h => h.status === 'READY') && (
                        <p className="text-xs text-[var(--color-muted)] mt-1">
                          {new Date(order.history.find(h => h.status === 'READY').time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* COLLECTED */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${order.status === 'COLLECTED' ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-line)]'}`}></div>
                    </div>
                    <div>
                      <p className={`font-medium ${order.status === 'COLLECTED' ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>Collected</p>
                      {order.status === 'COLLECTED' && order.history.find(h => h.status === 'COLLECTED') && (
                        <p className="text-xs text-[var(--color-muted)] mt-1">
                          {new Date(order.history.find(h => h.status === 'COLLECTED').time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
