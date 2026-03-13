"use client";
import { useState } from "react";
import {
  Brain, RefreshCw, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Target, DollarSign,
  Star, ChevronRight, Sparkles
} from "lucide-react";
import { useTradePulseStore } from "@/lib/store";
import { formatINR, formatINRCompact, marketStatusLabel } from "@/lib/utils";
import { clsx } from "clsx";
import toast from "react-hot-toast";

const SENTIMENT_CONFIG = {
  bullish: { label: "Bullish", color: "text-trading-green", bg: "bg-trading-green/10 border-trading-green/30", icon: TrendingUp },
  bearish: { label: "Bearish", color: "text-trading-red", bg: "bg-trading-red/10 border-trading-red/30", icon: TrendingDown },
  neutral: { label: "Neutral", color: "text-muted-text", bg: "bg-panel-bg border-border-color", icon: Minus },
  volatile: { label: "Volatile", color: "text-trading-yellow", bg: "bg-trading-yellow/10 border-trading-yellow/30", icon: AlertTriangle },
};

export default function StrategyPage() {
  const { todayStrategy, setStrategy, indices, settings } = useTradePulseStore();
  const [loading, setLoading] = useState(false);
  const { open: marketOpen } = marketStatusLabel();

  const generateStrategy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profitTarget: settings.dailyProfitTarget,
          stopLoss: settings.dailyStopLoss,
          capital: settings.capitalDeployed,
          indices,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      setStrategy(data.strategy);
      if (data.ok) {
        toast.success("Strategy generated!");
      } else {
        toast("Strategy generated with fallback data", { icon: "⚠️" });
      }
    } catch (err) {
      toast.error("Failed to generate strategy");
    } finally {
      setLoading(false);
    }
  };

  const s = todayStrategy;
  const sentiment = s ? SENTIMENT_CONFIG[s.marketSentiment] : null;
  const SentimentIcon = sentiment?.icon ?? Minus;

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-primary-text flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            AI Strategy
          </h1>
          <p className="text-sm text-muted-text mt-0.5">
            Daily pre-market analysis powered by Claude AI
          </p>
        </div>
        <button
          onClick={generateStrategy}
          disabled={loading}
          className="tp-btn-primary flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Generating..." : s ? "Regenerate" : "Get Today's Brief"}
        </button>
      </div>

      {/* Your setup reminder */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Daily Target", value: formatINR(settings.dailyProfitTarget), color: "text-trading-green", icon: Target },
          { label: "Stop Loss", value: `-${formatINR(settings.dailyStopLoss)}`, color: "text-trading-red", icon: AlertTriangle },
          { label: "Capital to Deploy", value: formatINRCompact(settings.capitalDeployed), color: "text-primary-text", icon: DollarSign },
        ].map((c) => (
          <div key={c.label} className="tp-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-panel-bg flex items-center justify-center">
              <c.icon className={clsx("w-4 h-4", c.color)} />
            </div>
            <div>
              <div className="text-[11px] text-muted-text">{c.label}</div>
              <div className={clsx("font-mono font-semibold", c.color)}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!s && !loading && (
        <div className="tp-card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-semibold text-primary-text mb-2">No strategy yet today</h3>
          <p className="text-sm text-muted-text mb-6 max-w-sm mx-auto">
            Click &quot;Get Today&apos;s Brief&quot; to get an AI-powered market analysis
            tailored to your ₹{settings.dailyProfitTarget.toLocaleString("en-IN")} daily target.
          </p>
          <div className="flex gap-2 justify-center text-xs text-muted-text">
            <span>✓ NIFTY 50 key levels</span>
            <span>·</span>
            <span>✓ Market sentiment</span>
            <span>·</span>
            <span>✓ Capital suggestion</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="tp-card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-accent" />
          </div>
          <div className="text-sm text-muted-text">
            Analyzing market conditions...
          </div>
          <div className="text-xs text-muted-text mt-1">This takes 5-10 seconds</div>
        </div>
      )}

      {/* Strategy output */}
      {s && !loading && (
        <div className="space-y-4 animate-slide-up">

          {/* Sentiment banner */}
          <div className={clsx("tp-card flex items-start gap-4 border", sentiment?.bg)}>
            <div className={clsx(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              sentiment?.bg
            )}>
              <SentimentIcon className={clsx("w-6 h-6", sentiment?.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={clsx("font-bold text-lg", sentiment?.color)}>
                  {sentiment?.label} Market
                </div>
                <span className="text-xs text-muted-text">
                  as of {new Date(s.generatedAt).toLocaleTimeString("en-IN")}
                </span>
              </div>
              <p className="text-sm text-primary-text leading-relaxed">{s.summary}</p>
            </div>
          </div>

          {/* Key Levels + Suggested Capital */}
          <div className="grid grid-cols-2 gap-4">
            <div className="tp-card">
              <div className="section-title">Key Levels</div>
              <div className="space-y-2">
                {s.keyLevels.map((level, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border-color last:border-0">
                    <div className="text-xs text-muted-text">{level.label}</div>
                    <div className="num text-sm font-semibold text-primary-text">
                      {level.value.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tp-card">
              <div className="section-title">Capital Suggestion</div>
              <div className="text-3xl font-mono font-bold text-trading-green mb-2">
                {formatINR(s.suggestedCapital)}
              </div>
              <div className="text-xs text-muted-text mb-4">
                Suggested deployment out of ₹{settings.capitalDeployed.toLocaleString("en-IN")} available
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-trading-green"
                  style={{
                    width: `${Math.min(100, (s.suggestedCapital / settings.capitalDeployed) * 100)}%`
                  }}
                />
              </div>
              <div className="text-[10px] text-muted-text mt-2">
                {((s.suggestedCapital / settings.capitalDeployed) * 100).toFixed(0)}% of capital
              </div>

              <div className="mt-4 bg-trading-yellow/10 border border-trading-yellow/30 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-trading-yellow flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-trading-yellow leading-relaxed">{s.riskNote}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sector trends */}
          <div className="tp-card">
            <div className="section-title">Sector Outlook</div>
            <div className="grid grid-cols-3 gap-3">
              {s.sectors.map((sec) => (
                <div key={sec.name} className={clsx(
                  "flex items-center justify-between px-3 py-2 rounded-lg border",
                  sec.trend === "up" ? "bg-trading-green/10 border-trading-green/20" :
                  sec.trend === "down" ? "bg-trading-red/10 border-trading-red/20" :
                  "bg-panel-bg border-border-color"
                )}>
                  <span className="text-sm text-primary-text">{sec.name}</span>
                  {sec.trend === "up" && <TrendingUp className="w-4 h-4 text-trading-green" />}
                  {sec.trend === "down" && <TrendingDown className="w-4 h-4 text-trading-red" />}
                  {sec.trend === "neutral" && <Minus className="w-4 h-4 text-muted-text" />}
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist */}
          {s.topWatchlist.length > 0 && (
            <div className="tp-card">
              <div className="section-title">Today's Watchlist</div>
              <div className="flex flex-wrap gap-2">
                {s.topWatchlist.map((sym) => (
                  <div key={sym} className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5">
                    <Star className="w-3 h-3 text-accent" />
                    <span className="font-mono text-sm text-accent">{sym}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-[11px] text-dim-text text-center leading-relaxed">
            ⚠️ This is AI-generated market analysis, not financial advice. 
            Always use your own judgment and maintain strict risk management. 
            Past market analysis does not guarantee future results.
          </div>
        </div>
      )}
    </div>
  );
}
