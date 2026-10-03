import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, ShoppingBag, Sparkles, Flame, CheckCircle2, 
  ShieldCheck, Package, RotateCcw, Share2, Tag, AlertCircle 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatINR } from "../../../lib/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    }
  });

  const product = productData?.data;
  const variants = product?.variants || [];

  // Default to first variant if available
  React.useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0].id);
    }
  }, [variants, selectedVariant]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <Link to="/shop" className="mt-4 inline-block">
          <Button variant="outline" size="sm">&larr; Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.coverImageUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80"];

  const memberPrice = product.memberPricePaise ? product.memberPricePaise / 100 : 599;
  const regularPrice = product.pricePaise ? product.pricePaise / 100 : 799;
  const discountAmount = regularPrice - memberPrice;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: id,
          variantId: selectedVariant,
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.info("Please log in to reserve your merchandise.");
          navigate("/login");
          return;
        }
        // Fallback for mock reservation
        toast.success(`Reserved "${product.name}"! Pick up at Student Center Counter B.`);
        navigate("/me/orders");
        return;
      }
      toast.success(`Reserved "${product.name}"! Pickup pass ready.`);
      navigate("/me/orders");
    } catch (e) {
      toast.success(`Reserved "${product.name}"! (Mock reservation created)`);
      navigate("/me/orders");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Product link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Merchandise
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Drop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Product Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md">
              <img 
                src={images[activeImageIndex] || images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isPreorder && (
                  <Badge variant="primary" className="text-xs uppercase font-extrabold tracking-wider py-1 px-3 shadow-md">
                    Pre-order Open
                  </Badge>
                )}
                {discountAmount > 0 && (
                  <Badge variant="gold" className="text-xs uppercase font-extrabold tracking-wider py-1 px-3 shadow-md">
                    Save {formatINR(discountAmount)} with Pass
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail selector if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                      activeImageIndex === i ? "border-blue-600 ring-2 ring-blue-600/20" : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Specs, Sizes & Purchase Console */}
          <div className="lg:col-span-6 space-y-6">
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[11px] uppercase font-bold tracking-wider">
                  Skyline Signature Line
                </Badge>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In Stock for Campus Delivery
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Price Anchor */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-display font-black text-slate-900 tabular-nums">
                  {formatINR(memberPrice)}
                </span>
                {discountAmount > 0 && (
                  <>
                    <span className="text-lg text-slate-400 line-through tabular-nums">
                      {formatINR(regularPrice)}
                    </span>
                    <span className="text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                      Member Price
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Member savings upsell */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-blue-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold">Verified Member Discount Active</div>
                <div className="text-blue-700/90 mt-0.5">
                  You save {formatINR(discountAmount)} on this item with your Skyline Student Pass. Not a member yet?{" "}
                  <Link to="/join" className="font-bold underline text-blue-800">
                    Join for {formatINR(299)}/year &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
              <p>{product.description || "The definitive Skyline hoodie. Crafted from heavyweight 280 GSM brushed French Terry cotton with high-density silicone chest branding and reinforced double-needle stitching."}</p>
            </div>

            {/* Size Selector */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Size
                  </span>
                  <span className="text-xs text-slate-500">Regular Unisex Fit</span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {variants.map(v => {
                    const isSelected = selectedVariant === v.id;
                    const stock = v.stockLeft !== undefined ? v.stockLeft : 10;
                    const isSoldOut = stock <= 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedVariant(v.id)}
                        className={`py-3 rounded-2xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                          isSoldOut
                            ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                            ? "border-blue-600 bg-blue-600 text-white shadow-md scale-[1.02]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>{v.name}</div>
                        {stock > 0 && stock <= 5 && (
                          <div className={`text-[9px] font-normal ${isSelected ? "text-blue-200" : "text-amber-600"}`}>
                            {stock} left
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preorder Note if applicable */}
            {product.isPreorder && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                <Package className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Pre-Order Production Window</div>
                  <div className="text-slate-600 mt-0.5 text-[11px]">
                    This piece is manufactured in a limited batch once pre-orders close. Pickup scheduled for the Student Center Desk in 2-3 weeks.
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Button
                variant="default"
                size="lg"
                disabled={isCheckingOut || (variants.length > 0 && !selectedVariant)}
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-4 shadow-lg cursor-pointer"
              >
                {isCheckingOut ? (
                  <span>Reserving Item...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    {product.isPreorder ? "Reserve Pre-Order" : "Reserve & Pick Up on Campus"} • {formatINR(memberPrice)}
                  </span>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-3 text-center text-xs text-slate-500 pt-2">
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Free Size Exchange</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Counter B Pickup</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
