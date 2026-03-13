"use client";
import { useState } from "react";
import { Users, Share2, Heart, TrendingUp, TrendingDown, Plus, X } from "lucide-react";
import { useTradePulseStore, getTotalPnL } from "@/lib/store";
import { formatINR, formatINRCompact, genId } from "@/lib/utils";
import type { TradeShare } from "@/lib/types";
import { clsx } from "clsx";
import toast from "react-hot-toast";

// ─── Demo feed data ────────────────────────────────────────────────────────────
const DEMO_FEED: TradeShare[] = [
  { id: "d1", userId: "u1", userName: "Rajesh T.", symbol: "BANKNIFTY", assetType: "options", action: "sold", quantity: 1, price: 340, pnl: 2800, note: "Closed at target 🎯", timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), likes: 12 },
  { id: "d2", userId: "u2", userName: "Priya M.", symbol: "NIFTY", assetType: "options", action: "sold", quantity: 2, price: 120, pnl: -800, note: "Stop loss hit. Discipline > greed", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), likes: 8 },
  { id: "d3", userId: "u3", userName: "Arjun K.", symbol: "RELIANCE", assetType: "stock", action: "bought", quantity: 10, price: 2934, note: "Long term hold. Results next week", timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), likes: 5 },
];

function ShareModal({ onClose }: { onClose: () => void }) {
  const { positions, shareToFeed } = useTradePulseStore();
  const [form, setForm] = useState({
    positionId: positions[0]?.id ?? "",
    action: "sold" as "bought" | "sold",
    note: "",
  });

  const selectedPos = positions.find((p) => p.id === form.positionId);

  const handleShare = () => {
    if (!selectedPos) {
      toast.error("Select a position to share");
      return;
    }
    const post: TradeShare = {
      id: genId(),
      userId: "me",
      userName: "You",
      symbol: selectedPos.symbol,
      assetType: selectedPos.assetType,
      action: form.action,
      quantity: selectedPos.quantity,
      price: selectedPos.currentPrice,
      pnl: selectedPos.pnl,
      note: form.note,
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    shareToFeed(post);
    toast.success("Shared to feed!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-border-color rounded-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
          <h2 className="font-semibold text-primary-text">Share Trade</h2>
          <button onClick={onClose} className="text-muted-text hover:text-primary-text"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-text mb-1 block">Position</label>
            <select className="tp-select" value={form.positionId}
              onChange={(e) => setForm((p) => ({ ...p, positionId: e.target.value }))}>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.symbol} — {p.pnl >= 0 ? "+" : ""}{formatINR(p.pnl)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-text mb-1 block">Action</label>
            <div className="flex gap-2">
              {(["bought", "sold"] as const).map((a) => (
                <button key={a} onClick={() => setForm((p) => ({ ...p, action: a }))}
                  className={clsx(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                    form.action === a
                      ? a === "bought" ? "bg-trading-green/10 border-trading-green/40 text-trading-green"
                        : "bg-trading-red/10 border-trading-red/40 text-trading-red"
                      : "border-border-color text-muted-text hover:border-border-bright"
                  )}>
                  {a === "bought" ? "📈 Bought" : "📉 Sold"}
                </button>
              ))}
            </div>
          </div>
          {selectedPos && (
            <div className="bg-panel-bg rounded-lg p-3 text-xs text-muted-text">
              <div className="font-medium text-primary-text mb-1">{selectedPos.symbol}</div>
              <div>Qty: {selectedPos.quantity} · Price: ₹{selectedPos.currentPrice.toFixed(2)}</div>
              <div className={clsx("mt-1 font-semibold", selectedPos.pnl >= 0 ? "text-trading-green" : "text-trading-red")}>
                P&L: {selectedPos.pnl >= 0 ? "+" : ""}{formatINR(selectedPos.pnl)}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-muted-text mb-1 block">Note (optional)</label>
            <textarea className="tp-input resize-none" rows={2} placeholder="What's your view?"
              value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border-color">
          <button onClick={onClose} className="tp-btn-secondary flex-1">Cancel</button>
          <button onClick={handleShare} className="tp-btn-primary flex-1">Share</button>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ post, liked, onLike }: { post: TradeShare; liked: boolean; onLike: () => void }) {
  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="tp-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
            {post.userName[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-primary-text">{post.userName}</div>
            <div className="text-[10px] text-muted-text">{timeAgo(post.timestamp)}</div>
          </div>
        </div>
        <div className={clsx(
          "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
          post.action === "bought"
            ? "bg-trading-green/10 text-trading-green border-trading-green/20"
            : "bg-trading-red/10 text-trading-red border-trading-red/20"
        )}>
          {post.action === "bought" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {post.action}
        </div>
      </div>

      <div className="bg-panel-bg rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono font-bold text-primary-text">{post.symbol}</div>
            <div className="text-xs text-muted-text mt-0.5">
              {post.quantity} × ₹{post.price.toFixed(2)} · {post.assetType}
            </div>
          </div>
          {post.pnl !== undefined && (
            <div className={clsx(
              "text-right font-mono font-bold",
              post.pnl >= 0 ? "text-trading-green" : "text-trading-red"
            )}>
              {post.pnl >= 0 ? "+" : ""}{formatINR(post.pnl)}
            </div>
          )}
        </div>
      </div>

      {post.note && (
        <p className="text-sm text-muted-text italic">&quot;{post.note}&quot;</p>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-border-color">
        <button onClick={onLike}
          className={clsx("flex items-center gap-1.5 text-xs transition-colors",
            liked ? "text-trading-red" : "text-muted-text hover:text-trading-red")}>
          <Heart className={clsx("w-3.5 h-3.5", liked && "fill-current")} />
          {post.likes + (liked ? 1 : 0)}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-text hover:text-primary-text transition-colors">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  );
}

export default function SocialPage() {
  const { socialFeed, positions } = useTradePulseStore();
  const [showShare, setShowShare] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const allPosts = [...socialFeed, ...DEMO_FEED];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-primary-text flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Social Feed
          </h1>
          <p className="text-sm text-muted-text mt-0.5">Live trades from your circle</p>
        </div>
        {positions.length > 0 && (
          <button onClick={() => setShowShare(true)} className="tp-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Share Trade
          </button>
        )}
      </div>

      <div className="max-w-lg space-y-4">
        {allPosts.map((post) => (
          <FeedCard key={post.id} post={post}
            liked={liked.has(post.id)}
            onLike={() => setLiked((s) => {
              const next = new Set(s);
              next.has(post.id) ? next.delete(post.id) : next.add(post.id);
              return next;
            })}
          />
        ))}
      </div>

      <div className="text-center text-xs text-dim-text pt-4">
        Invite friends to join TradePulse to see their live trades here
      </div>
    </div>
  );
}
