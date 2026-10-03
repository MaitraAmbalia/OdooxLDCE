import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Sparkles, Flame, Tag,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function ShopCatalog() {
  usePageTitle("Shop");

  const { data: productsData, isPending, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch("/api/v1/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  const products = productsData?.data || [];

  return (
    <div className="page-container py-12 sm:py-16">
        
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" aria-hidden="true" /> Official Skyline merchandise
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Campus favorites, made to keep.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Thoughtful staples and limited runs, with special pricing for Skyline members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/join">
              <Button variant="outline" className="bg-card">
                <Tag aria-hidden="true" /> Explore member pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Quality Guarantee Banner */}
        <div className="my-8 grid gap-4 rounded-2xl border border-border bg-card p-4 text-xs sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary font-semibold text-primary">
              ✓
            </div>
            <div>
              <div className="font-semibold">Made for repeat wear</div>
              <div className="text-[11px] text-muted-foreground">Heavyweight, pre-shrunk fabric</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#e4eee8] font-semibold text-[#345d4a]">
              ⚡
            </div>
            <div>
              <div className="font-semibold">Easy campus pickup</div>
              <div className="text-[11px] text-muted-foreground">Collect at the Student Center desk</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f5e4db] font-semibold text-[#86533d]">
              ★
            </div>
            <div>
              <div className="font-semibold">Community funded</div>
              <div className="text-[11px] text-muted-foreground">Proceeds support student projects</div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isPending ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading products">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        ) : isError ? (
          <ContentState error title="The shop is taking a little longer." description="We couldn’t load the catalog. Try again in a moment." action={refetch} />
        ) : products.length === 0 ? (
          <ContentState title="The next drop is on its way." description="New products and pre-orders will appear here when they’re ready." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => {
              const memberPrice = product.memberPricePaise ? product.memberPricePaise / 100 : 599;
              const regularPrice = product.pricePaise ? product.pricePaise / 100 : 799;
              const hasDiscount = regularPrice > memberPrice;

              return (
                <Link 
                  key={product.id} 
                  to={`/shop/${product.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                      {product.coverImageUrl ? (
                        <img 
                          src={product.coverImageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-secondary p-6 text-center">
                          <ShoppingBag className="size-16 text-primary/40" />
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
                        <span className="flex items-center gap-1 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-foreground backdrop-blur-md">
                          <Flame className="size-3 text-[#86533d]" /> Limited stock
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h2 className="line-clamp-1 font-display text-lg font-semibold transition-colors group-hover:text-primary">
                        {product.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {product.description || "Official LDCE Skyline apparel. 100% combed cotton with durable screen-printed crest."}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Anchor Footer */}
                  <div className="flex items-end justify-between border-t border-border bg-secondary/30 p-5 pt-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase text-muted-foreground">Member price</div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg font-semibold tabular-nums">
                          {formatINR(memberPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through tabular-nums">
                            {formatINR(regularPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-transform group-hover:translate-x-1">
                      View details &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

    </div>
  );
}
