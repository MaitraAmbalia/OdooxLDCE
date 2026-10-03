import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  Image as ImageIcon, 
  Link2, 
  RotateCcw, 
  Share2, 
  Trash2, 
  Upload, 
  X 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildWhatsAppTemplate, buildInstagramTemplate } from "@/utils/shareTemplates";
import { cn } from "@/lib/utils";

// Clean WhatsApp Icon
export function WhatsAppIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.58 20.15 9.14 19.76 7.89 19.02L7.59 18.84L4.47 19.66L5.3 16.61L5.1 16.3C4.29 15.01 3.86 13.48 3.86 11.91C3.86 7.4 7.54 3.73 12.05 3.73C14.24 3.73 16.29 4.58 17.84 6.13C19.39 7.68 20.24 9.73 20.24 11.92C20.24 16.44 16.57 20.15 12.05 20.15ZM16.57 14.39C16.32 14.27 15.11 13.67 14.88 13.59C14.66 13.5 14.5 13.46 14.34 13.71C14.17 13.95 13.71 14.5 13.56 14.66C13.42 14.83 13.28 14.85 13.03 14.73C12.78 14.6 11.99 14.34 11.05 13.5C10.31 12.84 9.82 12.03 9.68 11.78C9.53 11.53 9.66 11.4 9.79 11.27C9.9 11.16 10.03 10.99 10.15 10.84C10.28 10.7 10.32 10.59 10.4 10.43C10.49 10.26 10.45 10.12 10.38 9.99C10.32 9.87 9.83 8.66 9.62 8.16C9.42 7.68 9.22 7.74 9.07 7.73H8.59C8.42 7.73 8.16 7.79 7.93 8.04C7.71 8.28 7.07 8.88 7.07 10.1C7.07 11.32 7.96 12.49 8.08 12.65C8.21 12.82 9.83 15.31 12.3 16.38C12.89 16.63 13.35 16.78 13.71 16.9C14.3 17.09 14.83 17.06 15.26 17C15.74 16.93 16.73 16.4 16.94 15.82C17.14 15.24 17.14 14.74 17.08 14.64C17.02 14.54 16.82 14.51 16.57 14.39Z" />
    </svg>
  );
}

// Clean Instagram Icon
export function InstagramIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0ZM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM18.406 4.155a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  );
}

export function SocialShareModal({
  open,
  onOpenChange,
  shareData = {},
}) {
  const [activeTab, setActiveTab] = useState("whatsapp"); // 'whatsapp' | 'instagram'
  const [instagramMode, setInstagramMode] = useState("story"); // 'story' | 'feed'
  const [copiedKey, setCopiedKey] = useState(null);
  const fileInputRef = useRef(null);

  const url = shareData.url || (typeof window !== "undefined" ? window.location.href : "");

  // Default templates
  const defaultWa = useMemo(() => {
    return buildWhatsAppTemplate({
      type: shareData.type || "event",
      title: shareData.title || "",
      description: shareData.description || shareData.body || "",
      date: shareData.date || shareData.publishedAt || shareData.startAt,
      venue: shareData.venue || shareData.location,
      audience: shareData.audience,
      price: shareData.price,
      author: shareData.author?.name || shareData.organizer,
      url,
    });
  }, [shareData, url]);

  const defaultIg = useMemo(() => {
    return buildInstagramTemplate({
      type: shareData.type || "event",
      title: shareData.title || "",
      description: shareData.description || shareData.body || "",
      date: shareData.date || shareData.publishedAt || shareData.startAt,
      venue: shareData.venue || shareData.location,
      audience: shareData.audience,
      price: shareData.price,
      url,
    });
  }, [shareData, url]);

  // Editable state
  const [waText, setWaText] = useState("");
  const [igStoryText, setIgStoryText] = useState("");
  const [igFeedText, setIgFeedText] = useState("");
  const [attachedImage, setAttachedImage] = useState(shareData.imageUrl || null);

  useEffect(() => {
    if (open) {
      setWaText(defaultWa.text);
      setIgStoryText(defaultIg.storyText);
      setIgFeedText(defaultIg.feedText);
      setAttachedImage(shareData.imageUrl || null);
    }
  }, [open, defaultWa.text, defaultIg.storyText, defaultIg.feedText, shareData.imageUrl]);

  const waShareUrl = useMemo(() => {
    return `https://wa.me/?text=${encodeURIComponent(waText || "")}`;
  }, [waText]);

  const activeInstagramText = instagramMode === "story" ? igStoryText : igFeedText;

  const handleCopy = async (text, key, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Could not copy text");
    }
  };

  const handleResetCurrent = () => {
    if (activeTab === "whatsapp") {
      setWaText(defaultWa.text);
      toast.info("Reset to default message");
    } else if (instagramMode === "story") {
      setIgStoryText(defaultIg.storyText);
      toast.info("Reset to default story caption");
    } else {
      setIgFeedText(defaultIg.feedText);
      toast.info("Reset to default feed caption");
    }
  };

  const handleCopyImage = async () => {
    if (!attachedImage) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = attachedImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Blob conversion failed");
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          setCopiedKey("poster_image");
          toast.success("Poster image copied to clipboard");
          setTimeout(() => setCopiedKey(null), 2000);
        } catch {
          handleDownloadImage();
        }
      }, "image/png");
    } catch {
      handleDownloadImage();
    }
  };

  const handleDownloadImage = () => {
    if (!attachedImage) return;
    const a = document.createElement("a");
    a.href = attachedImage;
    const safeTitle = (shareData.title || "poster").toLowerCase().replace(/[^a-z0-9]/g, "-");
    a.download = `${safeTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Poster downloaded");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result);
        toast.success("Image attached");
      };
      reader.readAsDataURL(file);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = async () => {
    const currentText = activeTab === "whatsapp" ? waText : activeInstagramText;
    const sharePayload = {
      title: shareData.title || "Campus update",
      text: currentText,
      url,
    };

    if (attachedImage && navigator.canShare) {
      try {
        const res = await fetch(attachedImage);
        const blob = await res.blob();
        const file = new File([blob], "poster.png", { type: blob.type || "image/png" });
        if (navigator.canShare({ files: [file] })) {
          sharePayload.files = [file];
        }
      } catch {
        // text fallback
      }
    }

    try {
      await navigator.share(sharePayload);
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("Could not trigger device share");
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Subtle Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Modal Card */}
      <div className="relative z-50 w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
              Share {shareData.type === 'merch' ? 'merch drop' : shareData.type === 'announcement' ? 'notice' : 'event'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {shareData.title || "Campus announcement"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Segmented Platform Tabs */}
          <div className="grid grid-cols-2 rounded-lg bg-secondary p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("whatsapp")}
              className={cn(
                "flex items-center justify-center gap-2 py-1.5 px-3 rounded-md transition cursor-pointer",
                activeTab === "whatsapp" 
                  ? "bg-card text-foreground shadow-xs font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <WhatsAppIcon className="size-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("instagram")}
              className={cn(
                "flex items-center justify-center gap-2 py-1.5 px-3 rounded-md transition cursor-pointer",
                activeTab === "instagram" 
                  ? "bg-card text-foreground shadow-xs font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <InstagramIcon className="size-3.5 text-pink-600" />
              <span>Instagram</span>
            </button>
          </div>

          {/* Attached Poster Row (Compact & Clean) */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-2.5 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {attachedImage ? (
                <img 
                  src={attachedImage} 
                  alt="Poster" 
                  className="size-9 rounded-md object-cover border border-border shrink-0" 
                />
              ) : (
                <div className="size-9 rounded-md border border-dashed border-border bg-card flex items-center justify-center text-muted-foreground shrink-0">
                  <ImageIcon className="size-4 opacity-50" />
                </div>
              )}
              <div className="truncate">
                <p className="font-medium text-foreground truncate">
                  {attachedImage ? "Cover poster attached" : "No image attached"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {attachedImage ? "Copy image to paste with caption" : "Optional flyer for social posts"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {attachedImage ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleCopyImage}
                    title="Copy poster image to clipboard"
                  >
                    {copiedKey === "poster_image" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedKey === "poster_image" ? "Copied" : "Copy image"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleDownloadImage}
                    title="Download poster"
                  >
                    <Download className="size-3 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setAttachedImage(null)}
                    title="Remove image"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1"
                >
                  <Upload className="size-3" />
                  <span>Attach flyer</span>
                </Button>
              )}
            </div>
          </div>

          {/* WhatsApp Tab View */}
          {activeTab === "whatsapp" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Message text</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] tabular-nums">{waText.length} chars</span>
                  <button
                    type="button"
                    onClick={handleResetCurrent}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    <RotateCcw className="size-3" /> Reset
                  </button>
                </div>
              </div>

              <textarea
                value={waText}
                onChange={(e) => setWaText(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20 transition resize-none"
                placeholder="Message text..."
              />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  asChild
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                >
                  <a href={waShareUrl} target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="size-4" />
                    <span>Send on WhatsApp</span>
                    <ExternalLink className="size-3.5 opacity-70" />
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(waText, "wa_text", "WhatsApp text")}
                  className="gap-2 font-medium"
                >
                  {copiedKey === "wa_text" ? (
                    <>
                      <Check className="size-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copy text</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Instagram Tab View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-md bg-secondary p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setInstagramMode("story")}
                    className={cn(
                      "px-2.5 py-1 rounded transition cursor-pointer",
                      instagramMode === "story" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Story sticker
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstagramMode("feed")}
                    className={cn(
                      "px-2.5 py-1 rounded transition cursor-pointer",
                      instagramMode === "feed" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Feed caption
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetCurrent}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              </div>

              <textarea
                value={instagramMode === "story" ? igStoryText : igFeedText}
                onChange={(e) => {
                  if (instagramMode === "story") setIgStoryText(e.target.value);
                  else setIgFeedText(e.target.value);
                }}
                rows={7}
                className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20 transition resize-none"
                placeholder="Instagram caption..."
              />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      activeInstagramText,
                      "ig_text",
                      instagramMode === "story" ? "Story caption" : "Feed caption"
                    )
                  }
                  className="gap-2 font-medium"
                >
                  {copiedKey === "ig_text" ? (
                    <>
                      <Check className="size-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copy caption</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="gap-2 font-medium"
                >
                  <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                    <InstagramIcon className="size-4 text-pink-600" />
                    <span>Open Instagram</span>
                    <ExternalLink className="size-3.5 opacity-70" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Native Device Share (subtle link) */}
          {canNativeShare && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition cursor-pointer"
              >
                <Share2 className="size-3" />
                <span>Share via system dialog…</span>
              </button>
            </div>
          )}

        </div>

        {/* Clean Link Bar Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/20 px-5 py-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground truncate min-w-0">
            <Link2 className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate select-all">{url}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleCopy(url, "direct_url", "Link")}
            className="shrink-0 text-primary font-medium hover:text-primary/90"
          >
            {copiedKey === "direct_url" ? (
              <>
                <Check className="size-3 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy link</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
