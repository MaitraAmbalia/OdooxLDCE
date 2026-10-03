import { useEffect, useState } from "react";
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
import { ContentState } from "../../../components/common/ContentState";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { SocialShareModal } from "../../../components/common/SocialShareModal";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: productData, isPending, isError, refetch } = useQuery({
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
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0].id);
    }
  }, [variants, selectedVariant]);

  usePageTitle(product?.name || "Product details");

  if (isPending) {
    return (
      <div className="page-container py-12" role="status" aria-label="Loading product details">
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

  if (isError || !product) {
    return (
      <div className="page-container py-16">
        <ContentState error title="We couldn’t load this product." description="It may no longer be available, or the connection may have been interrupted." action={refetch} />
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.coverImageUrl ? [product.coverImageUrl] : [];

  const memberPrice = product.memberPricePaise ? product.memberPricePaise / 100 : 599;
  const regularPrice = product.nonMemberPricePaise 
    ? product.nonMemberPricePaise / 100 
    : (product.pricePaise ? product.pricePaise / 100 : Math.round(memberPrice * 1.3));
  const discountAmount = Math.max(0, regularPrice - memberPrice);

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
        throw new Error(json.error?.message || "Could not reserve this item");
      }
      const paymentId = json.data?.payment?.paymentId;
      if (paymentId) {
        toast.success(`Reserved "${product.name}" for 15 minutes. Complete payment to confirm.`);
        navigate(`/checkout/status/${paymentId}`);
      } else {
        navigate("/me/orders");
      }
    } catch (error) {
      toast.error(error.message || "Could not reserve this item. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <div className="page-container py-10 sm:py-14">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/shop" 
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Back to shop
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Drop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Product Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-secondary">
              {images.length ? <img
                src={images[activeImageIndex] || images[0]} 
                alt={product.name} 
                className="size-full object-cover"
              /> : <div className="flex size-full flex-col items-center justify-center gap-3 text-primary/40"><ShoppingBag className="size-20" /><span className="text-sm font-medium">Image coming soon</span></div>}

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
                      activeImageIndex === i ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70 hover:opacity-100"
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
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                  Skyline Signature Line
                </Badge>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In Stock for Campus Delivery
                </span>
              </div>

              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {product.name}
              </h1>

              {/* Price Anchor */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-4xl font-semibold tabular-nums">
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
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-4 text-secondary-foreground">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="text-xs">
                <div className="font-semibold">Member pricing</div>
                <div className="mt-0.5 text-muted-foreground">
                  You save {formatINR(discountAmount)} on this item with your Skyline Student Pass. Not a member yet?{" "}
                  <Link to="/join" className="font-medium text-primary underline">
                    Explore membership &rarr;
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
                  <span className="text-xs text-slate-400">Regular Unisex Fit</span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {variants.map(v => {
                    const isSelected = selectedVariant === v.id;
                    const stock = v.stockAvailable !== undefined
                      ? v.stockAvailable
                      : (v.stock !== undefined ? Math.max(0, (v.stock || 0) - (v.reserved || 0)) : (v.stockLeft !== undefined ? v.stockLeft : 10));
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
                            ? "scale-[1.02] border-primary bg-primary text-white"
                            : "border-slate-200 bg-white text-slate-900 hover:border-primary/30 hover:bg-slate-50"
                        }`}
                      >
                        <div>{v.size || v.name || "Size"}</div>
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
                className="w-full"
              >
                {isCheckingOut ? (
                  <span>Reserving item…</span>
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

        {/* Social Share Modal */}
        {product && (
          <SocialShareModal
            open={isShareModalOpen}
            onOpenChange={setIsShareModalOpen}
            shareData={{
              type: "merch",
              title: product.name,
              description: product.description,
              price: formatINR(memberPrice),
              venue: "Skyline Merch Desk (Counter B)",
              url: typeof window !== "undefined" ? window.location.href : "",
            }}
          />
        )}

    </div>
  );
}
