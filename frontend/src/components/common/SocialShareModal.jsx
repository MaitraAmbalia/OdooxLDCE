import React, { useState, useMemo } from "react";
import { Check, Copy, ExternalLink, Link2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsAppTemplate, buildInstagramTemplate } from "@/utils/shareTemplates";

// Authentic WhatsApp SVG Icon
export function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.58 20.15 9.14 19.76 7.89 19.02L7.59 18.84L4.47 19.66L5.3 16.61L5.1 16.3C4.29 15.01 3.86 13.48 3.86 11.91C3.86 7.4 7.54 3.73 12.05 3.73C14.24 3.73 16.29 4.58 17.84 6.13C19.39 7.68 20.24 9.73 20.24 11.92C20.24 16.44 16.57 20.15 12.05 20.15ZM16.57 14.39C16.32 14.27 15.11 13.67 14.88 13.59C14.66 13.5 14.5 13.46 14.34 13.71C14.17 13.95 13.71 14.5 13.56 14.66C13.42 14.83 13.28 14.85 13.03 14.73C12.78 14.6 11.99 14.34 11.05 13.5C10.31 12.84 9.82 12.03 9.68 11.78C9.53 11.53 9.66 11.4 9.79 11.27C9.9 11.16 10.03 10.99 10.15 10.84C10.28 10.7 10.32 10.59 10.4 10.43C10.49 10.26 10.45 10.12 10.38 9.99C10.32 9.87 9.83 8.66 9.62 8.16C9.42 7.68 9.22 7.74 9.07 7.73H8.59C8.42 7.73 8.16 7.79 7.93 8.04C7.71 8.28 7.07 8.88 7.07 10.1C7.07 11.32 7.96 12.49 8.08 12.65C8.21 12.82 9.83 15.31 12.3 16.38C12.89 16.63 13.35 16.78 13.71 16.9C14.3 17.09 14.83 17.06 15.26 17C15.74 16.93 16.73 16.4 16.94 15.82C17.14 15.24 17.14 14.74 17.08 14.64C17.02 14.54 16.82 14.51 16.57 14.39Z" />
    </svg>
  );
}

// Authentic Instagram SVG Icon
export function InstagramIcon({ className = "w-5 h-5" }) {
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

  const url = shareData.url || (typeof window !== "undefined" ? window.location.href : "");

  // Generate WhatsApp template
  const wa = useMemo(() => {
    return buildWhatsAppTemplate({
      type: shareData.type || "announcement",
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

  // Generate Instagram templates
  const ig = useMemo(() => {
    return buildInstagramTemplate({
      type: shareData.type || "announcement",
      title: shareData.title || "",
      description: shareData.description || shareData.body || "",
      date: shareData.date || shareData.publishedAt || shareData.startAt,
      venue: shareData.venue || shareData.location,
      audience: shareData.audience,
      price: shareData.price,
      url,
    });
  }, [shareData, url]);

  const activeInstagramText = instagramMode === "story" ? ig.storyText : ig.feedText;

  const handleCopy = async (text, key, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard! ✨`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Could not copy text to clipboard.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-foreground/65 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-50 w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3 border-b border-border bg-muted/30">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Campus Social Share
            </div>
            <h2 className="text-xl font-display font-bold tracking-tight text-foreground line-clamp-1">
              {shareData.title || "Share with Students"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Custom formatted templates ready for WhatsApp groups & Instagram stories
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="grid grid-cols-2 p-3 gap-2 bg-muted/40 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "whatsapp"
                ? "bg-[#25D366] text-white shadow-sm shadow-[#25D366]/30 font-bold"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/60"
            }`}
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span>WhatsApp Template</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instagram")}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "instagram"
                ? "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-sm shadow-pink-500/20 font-bold"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/60"
            }`}
          >
            <InstagramIcon className="w-4 h-4 shrink-0" />
            <span>Instagram Template</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {activeTab === "whatsapp" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Message Preview</span>
                <span className="bg-emerald-500/10 text-success dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Formatted for WhatsApp Markdown
                </span>
              </div>

              {/* Chat Bubble Preview */}
              <div className="relative rounded-2xl border border-emerald-600/20 bg-success-soft/50 dark:bg-emerald-950/20 p-4 font-sans text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap select-all shadow-inner">
                <div className="absolute top-2 right-2.5 text-[10px] text-muted-foreground flex items-center gap-1 opacity-70">
                  <span>LDCE Portal</span>
                  <span>✓✓</span>
                </div>
                {wa.text}
              </div>

              {/* Actions for WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={wa.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm transition-colors text-center"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(wa.text, "wa_text", "WhatsApp formatted text")}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  {copiedKey === "wa_text" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-success dark:text-emerald-400">Copied Text!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                      <span>Copy WhatsApp Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Instagram Mode Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Select Format:</span>
                <div className="inline-flex rounded-xl bg-muted p-1 border border-border/80">
                  <button
                    type="button"
                    onClick={() => setInstagramMode("story")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      instagramMode === "story"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Story Sticker Caption
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstagramMode("feed")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      instagramMode === "feed"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Feed / Reel Caption
                  </button>
                </div>
              </div>

              {/* Instagram Preview Card */}
              <div className="relative rounded-2xl border border-pink-500/20 bg-gradient-to-b from-pink-50/30 to-purple-50/20 dark:from-pink-950/20 dark:to-purple-950/10 p-4 font-sans text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap select-all shadow-inner">
                <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-border/60">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-white dark:bg-foreground flex items-center justify-center text-[10px] font-bold text-pink-600">
                      S
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-foreground">@skylineldce</span>
                  <span className="text-[10px] text-muted-foreground">• LDCE Campus</span>
                </div>
                {activeInstagramText}
              </div>

              {/* Pro Tip */}
              <div className="rounded-xl bg-warning/10 border border-amber-500/20 px-3.5 py-2 text-xs text-warning dark:text-amber-300">
                <p>
                  💡 <strong>How to post:</strong> Click <em>Copy Instagram Caption</em>, then add a photo/poster to your Instagram Story or Post. In Stories, use the <strong>"Link" sticker</strong> with the portal link!
                </p>
              </div>

              {/* Actions for Instagram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      activeInstagramText,
                      "ig_text",
                      instagramMode === "story" ? "Instagram Story caption" : "Instagram Feed caption"
                    )
                  }
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white shadow-sm transition-opacity cursor-pointer text-center"
                >
                  {copiedKey === "ig_text" ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied Caption! ✨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Caption & Tags</span>
                    </>
                  )}
                </button>

                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors text-center"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-600" />
                  <span>Open Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Quick Link Footer */}
        <div className="p-3.5 px-5 bg-muted/40 border-t border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground truncate min-w-0">
            <Link2 className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="truncate">{url}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(url, "direct_url", "Portal link")}
            className="shrink-0 font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === "direct_url" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-success dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
