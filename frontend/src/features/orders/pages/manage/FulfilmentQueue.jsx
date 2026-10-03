import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FulfilmentQueue() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("PAID"); // PAID, READY, COLLECTED

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'queue', { status: filter }],
    queryFn: async () => {
      // API endpoint: GET /orders?status=...
      const res = await fetch(`/api/v1/orders?status=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      // API endpoint: PATCH /orders/:id/status
      console.log(`Updating order ${orderId} to ${status}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'queue'] });
    }
  });

  const orders = ordersData?.data || [];
  const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);
  const searchedOrders = searchTerm 
    ? filteredOrders.filter(o => o.id.includes(searchTerm.toUpperCase()) || o.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.user.studentId.includes(searchTerm))
    : filteredOrders;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Fulfilment Queue</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Pack orders and hand them over to students.</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 bg-[var(--color-paper)] border-b border-[var(--color-line)] flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 bg-white rounded-[6px] p-1 border border-[var(--color-line)] inline-flex">
            {['PAID', 'READY', 'COLLECTED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded ${filter === f ? 'bg-[var(--color-ink)] text-white shadow' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
              >
                {f === 'PAID' ? 'To Pack (Paid)' : f === 'READY' ? 'Ready for Pickup' : 'Collected'}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search order or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:outline-none focus:border-[var(--color-dusk)]"
            />
            <span className="absolute left-3 top-2 text-[var(--color-muted)] text-sm">🔍</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-line)]">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] bg-white">
              {isLoading ? (
                <tr><td colSpan="4" className="p-8 text-center text-[var(--color-muted)]">Loading queue...</td></tr>
              ) : searchedOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold font-mono text-[var(--color-ink)]">{order.id}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">{new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-[var(--color-ink)]">{order.user.name}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1 font-mono">{order.user.studentId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <ul className="text-sm space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i} className="text-[var(--color-ink)]">
                          <span className="font-bold">{item.quantity}x</span> {item.name} <span className="text-[var(--color-muted)]">({item.variant})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {order.status === 'PAID' && (
                      <button 
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'READY' })}
                        className="bg-[var(--color-info)] text-white px-4 py-1.5 rounded-[6px] text-sm font-medium hover:bg-opacity-90"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button 
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'COLLECTED' })}
                        className="bg-[var(--color-ok)] text-white px-4 py-1.5 rounded-[6px] text-sm font-medium hover:bg-opacity-90"
                      >
                        Handed Over
                      </button>
                    )}
                    {order.status === 'COLLECTED' && (
                      <span className="text-sm font-bold text-[var(--color-ok)] flex items-center justify-end gap-1">
                        ✓ Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {searchedOrders.length === 0 && !isLoading && (
                <tr><td colSpan="4" className="p-12 text-center text-[var(--color-muted)]">No orders in this queue.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
