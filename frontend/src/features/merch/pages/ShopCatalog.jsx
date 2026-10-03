import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingBag, Sparkles, Flame, ShieldCheck, Tag, 
  ArrowRight, CheckCircle2, Filter, Layers 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";

export default function ShopCatalog() {
  const [filter, setFilter] = useState("ALL");

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch("/api/v1/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  const products = productsData?.data || [];

  return (
    <div className="min-h-screen bg-[var(--color-paper)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
          <div>
            <Badge variant="gold" className="text-xs uppercase font-extrabold tracking-wider px-3 py-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-950" /> Official LDCE Skyline Merch Drop
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
              Apparel & Collectibles
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Heavyweight hoodies, embroidered varsity jackets, and limited-edition tech badges. Verified members receive exclusive club discount pricing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/join">
              <Button variant="outline" size="sm" className="bg-white border-slate-300 text-xs shadow-2xs">
                <Tag className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                Unlock ₹200 Member Discounts
              </Button>
            </Link>
          </div>
        </div>

        {/* Quality Guarantee Banner */}
        <div className="my-8 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="font-bold text-slate-900">Premium 240+ GSM Cotton</div>
              <div className="text-[11px] text-slate-500">Heavyweight, pre-shrunk fabric</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <div className="font-bold text-slate-900">Campus Pickup Desk</div>
              <div className="text-[11px] text-slate-500">Direct collect at Student Center Desk</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ★
            </div>
            <div>
              <div className="font-bold text-slate-900">100% Non-Profit Proceeds</div>
              <div className="text-[11px] text-slate-500">Funds student robotics & hackathon teams</div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600 font-medium">
            Failed to load catalog. Please refresh.
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">New batch arriving soon</h3>
            <p className="text-xs text-slate-400 mt-1">Pre-orders for the winter drop open next Monday.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(product => {
              const memberPrice = product.memberPricePaise ? product.memberPricePaise / 100 : 599;
              const regularPrice = product.pricePaise ? product.pricePaise / 100 : 799;
              const hasDiscount = regularPrice > memberPrice;

              return (
                <Link 
                  key={product.id} 
                  to={`/shop/${product.id}`}
                  className="group flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                      {product.coverImageUrl ? (
                        <img 
                          src={product.coverImageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center p-6 text-center">
                          <ShoppingBag className="w-16 h-16 text-slate-400" />
                        </div>
                      )}

                      {/* Overlays */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.isPreorder && (
                          <Badge variant="primary" className="text-[10px] font-black uppercase tracking-wider py-0.5 shadow-sm">
                            Pre-Order Batch
                          </Badge>
                        )}
                        {hasDiscount && (
                          <Badge variant="gold" className="text-[10px] font-black uppercase tracking-wider py-0.5 shadow-sm">
                            Member Special
                          </Badge>
                        )}
                      </div>

                      {/* Stock Urgency */}
                      <div className="absolute bottom-3 left-3">
                        <span className="text-[10px] font-bold bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-slate-800 shadow-2xs border border-white/60 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Limited Stock
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h2 className="text-base font-display font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {product.description || "Official LDCE Skyline apparel. 100% combed cotton with durable screen-printed crest."}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Anchor Footer */}
                  <div className="p-5 pt-3 border-t border-slate-100 flex items-end justify-between bg-slate-50/40">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">Member Price</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-display font-black text-slate-900 tabular-nums">
                          {formatINR(memberPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through tabular-nums">
                            {formatINR(regularPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      View Details &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
