import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      // API endpoint: GET /products/:id
      const res = await fetch(`/api/v1/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-20 text-center text-[var(--color-muted)]">Loading product...</div>;

  const product = productData?.data || { images: [], variants: [] };

  // Assume viewer is not a member for public view simulation
  const isMember = false;
  const displayPrice = isMember ? product.memberPricePaise : product.pricePaise;

  const handleCheckout = () => {
    // In a real app, this would mutate cart or go straight to checkout sheet
    alert(`Checking out with variant ${selectedVariant}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/shop" className="text-sm font-medium text-[var(--color-dusk)] hover:underline">
          &larr; Back to Shop
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-gray-100 rounded-[10px] overflow-hidden border border-[var(--color-line)] relative">
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            {product.isPreorder && (
              <span className="absolute top-4 left-4 bg-[var(--color-info)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-[6px]">
                Pre-order open
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(1).map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-[6px] overflow-hidden border border-[var(--color-line)]">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Buy */}
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[var(--color-ink)] mb-4">{product.name}</h1>

          <div className="mb-6 flex items-baseline gap-4">
            <span className="text-3xl font-mono font-bold text-[var(--color-ink)]">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(displayPrice / 100)}
            </span>
            {!isMember && product.memberPricePaise < product.pricePaise && (
              <span className="text-sm font-medium bg-[var(--color-lamp)] text-[var(--color-ink)] px-2 py-1 rounded">
                Members pay {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.memberPricePaise / 100)}
              </span>
            )}
          </div>

          <p className="text-base text-[var(--color-ink)] mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-[var(--color-ink)]">Size</h3>
                <button className="text-sm text-[var(--color-dusk)] hover:underline">Size guide</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.variants.map(variant => {
                  const isSelected = selectedVariant === variant.id;
                  const isAvailable = variant.inStock || product.isPreorder;

                  return (
                    <button
                      key={variant.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`py-3 rounded-[6px] font-medium border text-sm transition-all ${
                        !isAvailable ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' :
                        isSelected ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-md' :
                        'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-dusk)]'
                      }`}
                    >
                      {variant.name}
                      {isAvailable && !product.isPreorder && variant.stockLeft <= 5 && (
                        <span className="block text-[10px] font-normal text-[var(--color-wait)] mt-0.5">Only {variant.stockLeft} left</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-[var(--color-line)]">
            {product.isPreorder && (
              <div className="bg-[var(--color-paper)] p-4 rounded-[6px] mb-4 text-sm text-[var(--color-ink)] flex gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <p className="font-bold">This is a pre-order item.</p>
                  <p className="text-[var(--color-muted)] mt-1">Orders will be bulk-manufactured after {new Date(product.preorderEndsAt).toLocaleDateString()}. Expected pickup in 3-4 weeks.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!selectedVariant && product.variants.length > 0}
              className="w-full bg-[var(--color-dusk)] text-white font-bold text-lg py-4 rounded-[10px] hover:bg-opacity-90 disabled:opacity-50 transition-opacity"
            >
              {product.isPreorder ? 'Reserve Pre-order' : 'Buy Now'}
            </button>

            <div className="mt-4 flex justify-center gap-4">
              <button className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-dusk)] flex items-center gap-2">
                WhatsApp <span aria-hidden="true">&rarr;</span>
              </button>
              <button className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-dusk)] flex items-center gap-2">
                Copy Link <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
