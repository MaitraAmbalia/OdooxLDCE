import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ShopCatalog() {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // API endpoint: GET /products
      const res = await fetch("/api/v1/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  const products = productsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-display font-extrabold text-[var(--color-ink)] mb-4">Official Merchandise</h1>
        <p className="text-lg text-[var(--color-muted)]">Support the Skyline Student Association. Members get exclusive discounts on most items.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-[var(--color-muted)]">Loading catalog...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <Link key={product.id} to={`/shop/${product.id}`} className="group block">
              <div className="aspect-[4/5] bg-gray-100 rounded-[10px] overflow-hidden mb-4 relative">
                <img 
                  src={product.coverImageUrl} 
                  alt={product.name} 
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!product.inStock && !product.isPreorder ? 'opacity-50 grayscale' : ''}`}
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isPreorder && (
                    <span className="bg-[var(--color-info)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                      Pre-order
                    </span>
                  )}
                  {!product.inStock && !product.isPreorder && (
                    <span className="bg-[var(--color-neutral)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-dusk)] transition-colors line-clamp-1">
                  {product.name}
                </h2>
                <div className="mt-1 flex items-baseline gap-2">
                  {/* Assuming member view is handled inside component; showing standard price here */}
                  <span className="font-mono font-bold text-[var(--color-ink)] text-lg">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.memberPricePaise / 100)}
                  </span>
                  {product.pricePaise > product.memberPricePaise && (
                    <span className="text-xs text-[var(--color-muted)] line-through">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.pricePaise / 100)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
