"use client";
import { useEffect, useCallback } from "react";
import useSWR from "swr";
import {
  TrendingUp, TrendingDown, Target, ShieldAlert,
  RefreshCw, ArrowUpRight, ArrowDownRight, Zap,
  BarChart2, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { useTradePulseStore, getTotalPnL, getTotalInvested } from "@/lib/store";
import {
  formatINR, formatINRCompact, formatPercent,
  pnlColor, marketStatusLabel, shouldFireAlert,
  sendBrowserNotification, sendWhatsAppAlert, genId, todayStr
} from "@/lib/utils";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Custom tooltip for chart ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-card-bg border border-border-color rounded-lg px-3 py-2 text-xs">
      <div className="text-muted-text mb-1">{label}</div>
      <div className={clsx("font-mono font-semibold", val >= 0 ? "text-trading-green" : "text-trading-red")}>
        {val >= 0 ? "+" : ""}{formatINR(val)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    positions, alertRules, firedAlerts, pnlHistory, indices,
    settings, setIndices, firealert, updateAlertRule, updatePrices
  } = useTradePulseStore();

  const totalPnL = getTotalPnL(positions);
  const totalInvested = getTotalInvested(positions);
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const { open: marketOpen, label: marketLabel, next: marketNext } = marketStatusLabel();

  // ─── Fetch live market indices ────────────────────────────────────────────
  const { data: marketData, isLoading: loadingMarket } = useSWR(
    "/api/market",
    fetcher,
    { refreshInterval: 30000 }
  );

  useEffect(() => {
    if (marketData?.indices) setIndices(marketData.indices);
  }, [marketData, setIndices]);

  // ─── Refresh stock prices every 30s ───────────────────────────────────────
  const refreshPrices = useCallback(async () => {
    const stockSymbols = positions
      .filter((p) => p.assetType === "stock")
      .map((p) => p.symbol);
    if (!stockSymbols.length) return;
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: stockSymbols }),
      });
      const data = await res.json();
      if (data.prices) updatePrices(data.prices);
    } catch { /* silent fail */ }
  }, [positions, updatePrices]);

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 30000);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  // ─── Alert engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    const activeRules = alertRules.filter((r) => r.isActive && !r.triggered);
    for (const rule of activeRules) {
      const { fire, message } = shouldFireAlert(rule, totalPnL, positions);
      if (fire) {
        const fired = {
          id: genId(),
          ruleId: rule.id,
          ruleName: rule.name,
          message,
          firedAt: new Date().toISOString(),
          value: totalPnL,
        };
        firealert(fired);
        updateAlertRule(rule.id, { triggered: true, triggeredAt: new Date().toISOString() });

        // Browser notification
        if (settings.notifications.browser) {
          sendBrowserNotification("TradePulse Alert", message);
        }
        // WhatsApp
        if (settings.notifications.whatsapp && settings.whatsappNumber && settings.callMeBotKey) {
          sendWhatsAppAlert(settings.whatsappNumber, settings.callMeBotKey, message);
        }
        // Toast
        toast(message, {
          icon: rule.type === "daily_profit_target" ? "🎯" : "🛑",
          duration: 8000,
        });
      }
    }
  }, [totalPnL, alertRules, positions, firealert, updateAlertRule, settings]);

  // ─── Progress bars ─────────────────────────────────────────────────────────
  const profitProgress = Math.min(
    100,
    totalPnL > 0 ? (totalPnL / settings.dailyProfitTarget) * 100 : 0
  );
  const lossProgress = Math.min(
    100,
    totalPnL < 0 ? (Math.abs(totalPnL) / settings.dailyStopLoss) * 100 : 0
  );

  // ─── P&L history chart data ────────────────────────────────────────────────
  const chartData = [...pnlHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((d) => ({ date: d.date.slice(5), pnl: d.pnl }));

  // Add today
  if (chartData.length === 0 || chartData[chartData.length - 1].date !== todayStr().slice(5)) {
    chartData.push({ date: todayStr().slice(5), pnl: totalPnL });
  }

  const winners = positions.filter((p) => p.pnl > 0);
  const losers = positions.filter((p) => p.pnl < 0);
  const recentAlerts = firedAlerts.slice(0, 3);

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-primary-text">
            Dashboard
          </h1>
          <p className="text-sm text-muted-text mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
            marketOpen
              ? "bg-trading-green/10 text-trading-green border-trading-green/30"
              : "bg-card-bg text-muted-text border-border-color"
          )}>
            <span className={clsx(
              "w-1.5 h-1.5 rounded-full",
              marketOpen ? "bg-trading-green animate-pulse" : "bg-muted-text"
            )} />
            {marketLabel}
          </div>
          <button
            onClick={() => {
              window.location.reload();
            }}
            title="Refresh page"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border-color bg-card-bg text-muted-text hover:text-primary-text hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Market Indices Ticker ────────────────────────────────────────── */}
      <div className="tp-card p-3 overflow-hidden">
        {loadingMarket && !indices.length ? (
          <div className="text-xs text-muted-text">Loading market data...</div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-1 no-scrollbar">
            {(indices.length ? indices : []).map((idx) => (
              <div key={idx.symbol} className="flex-shrink-0">
                <div className="text-[10px] text-muted-text uppercase tracking-wider">{idx.name}</div>
                <div className="font-mono font-semibold text-sm text-primary-text">
                  {idx.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                <div className={clsx(
                  "flex items-center gap-0.5 text-[11px] font-mono",
                  idx.change >= 0 ? "text-trading-green" : "text-trading-red"
                )}>
                  {idx.change >= 0
                    ? <ArrowUpRight className="w-3 h-3" />
                    : <ArrowDownRight className="w-3 h-3" />}
                  {formatPercent(idx.changePercent)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Main P&L + Target cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Total P&L */}
        <div className={clsx(
          "tp-card col-span-1",
          totalPnL >= 0 ? "animate-glow-green" : "animate-glow-red"
        )}>
          <div className="text-xs text-muted-text mb-2">Total Open P&amp;L</div>
          <div className={clsx(
            "font-mono font-bold text-3xl",
            totalPnL >= 0 ? "text-trading-green" : "text-trading-red"
          )}>
            {totalPnL >= 0 ? "+" : ""}{formatINR(totalPnL)}
          </div>
          <div className={clsx("font-mono text-sm mt-1", pnlColor(totalPnL))}>
            {totalPnL >= 0 ? "+" : ""}{totalPnLPct.toFixed(2)}%
          </div>
          <div className="mt-3 text-xs text-muted-text">
            {positions.length} position{positions.length !== 1 ? "s" : ""} · 
            Invested {formatINRCompact(totalInvested)}
          </div>
        </div>

        {/* Daily Profit Target */}
        <div className="tp-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-text flex items-center gap-1">
              <Target className="w-3 h-3" /> Daily Target
            </div>
            <div className="text-xs text-trading-green font-mono">
              {formatINRCompact(settings.dailyProfitTarget)}
            </div>
          </div>
          <div className="font-mono font-semibold text-xl text-trading-green">
            {profitProgress.toFixed(0)}%
          </div>
          <div className="progress-bar mt-2">
            <div
              className="progress-fill bg-trading-green"
              style={{ width: `${profitProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-text">
            {totalPnL > 0
              ? `₹${(settings.dailyProfitTarget - totalPnL).toFixed(0)} to go`
              : "No profit yet today"}
          </div>
        </div>

        {/* Daily Stop Loss */}
        <div className="tp-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-text flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Stop Loss
            </div>
            <div className="text-xs text-trading-red font-mono">
              -{formatINRCompact(settings.dailyStopLoss)}
            </div>
          </div>
          <div className="font-mono font-semibold text-xl text-trading-red">
            {lossProgress.toFixed(0)}%
          </div>
          <div className="progress-bar mt-2">
            <div
              className="progress-fill bg-trading-red"
              style={{ width: `${lossProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-text">
            {totalPnL < 0
              ? `₹${(settings.dailyStopLoss - Math.abs(totalPnL)).toFixed(0)} buffer left`
              : "Stop loss not triggered"}
          </div>
        </div>
      </div>

      {/* ─── P&L Chart + Portfolio breakdown ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Chart */}
        <div className="tp-card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-primary-text">30-Day P&amp;L</div>
            <div className="tp-badge-dim">
              <BarChart2 className="w-3 h-3" /> Last 30 days
            </div>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d97e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d97e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4560" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff4560" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => formatINRCompact(v)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#2a3f57" strokeDasharray="3 3" />
                <ReferenceLine y={settings.dailyProfitTarget} stroke="#00d97e" strokeDasharray="3 3" strokeOpacity={0.4}
                  label={{ value: "Target", fill: "#00d97e", fontSize: 9 }} />
                <ReferenceLine y={-settings.dailyStopLoss} stroke="#ff4560" strokeDasharray="3 3" strokeOpacity={0.4}
                  label={{ value: "SL", fill: "#ff4560", fontSize: 9 }} />
                <Area
                  type="monotone" dataKey="pnl"
                  stroke={totalPnL >= 0 ? "#00d97e" : "#ff4560"}
                  strokeWidth={2}
                  fill={totalPnL >= 0 ? "url(#green-grad)" : "url(#red-grad)"}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-text">
              <div className="text-center">
                <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Add positions to see your P&amp;L history
              </div>
            </div>
          )}
        </div>

        {/* Winners/Losers */}
        <div className="space-y-4">
          {/* Winners */}
          <div className="tp-card">
            <div className="text-xs text-muted-text mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-trading-green" /> Top Winners
            </div>
            {winners.length === 0 ? (
              <div className="text-xs text-muted-text">No winners yet</div>
            ) : (
              winners.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border-color last:border-0">
                  <div>
                    <div className="text-xs font-medium text-primary-text">{p.displayName}</div>
                    <div className="text-[10px] text-muted-text">{p.assetType}</div>
                  </div>
                  <div className="text-right">
                    <div className="num-green text-xs">+{formatINRCompact(p.pnl)}</div>
                    <div className="text-[10px] text-trading-green">{formatPercent(p.pnlPercent)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Losers */}
          <div className="tp-card">
            <div className="text-xs text-muted-text mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-trading-red" /> Top Losers
            </div>
            {losers.length === 0 ? (
              <div className="text-xs text-muted-text">No losers today 🎉</div>
            ) : (
              losers.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border-color last:border-0">
                  <div>
                    <div className="text-xs font-medium text-primary-text">{p.displayName}</div>
                    <div className="text-[10px] text-muted-text">{p.assetType}</div>
                  </div>
                  <div className="text-right">
                    <div className="num-red text-xs">{formatINRCompact(p.pnl)}</div>
                    <div className="text-[10px] text-trading-red">{formatPercent(p.pnlPercent)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Alerts ────────────────────────────────────────────────── */}
      {recentAlerts.length > 0 && (
        <div className="tp-card">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-primary-text flex items-center gap-2">
              <Zap className="w-4 h-4 text-trading-yellow" />
              Recent Alerts
            </div>
            <Link href="/alerts" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 bg-panel-bg rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 text-trading-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-primary-text text-xs">{a.message}</div>
                  <div className="text-[10px] text-muted-text mt-0.5">
                    {new Date(a.firedAt).toLocaleTimeString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Quick Actions (empty state) ─────────────────────────────────── */}
      {positions.length === 0 && (
        <div className="tp-card text-center py-10">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold text-primary-text mb-2">Welcome to TradePulse</h3>
          <p className="text-sm text-muted-text mb-6 max-w-xs mx-auto">
            Import your Groww portfolio CSV or add positions manually to start tracking your P&amp;L.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/portfolio" className="tp-btn-primary">
              Add Positions
            </Link>
            <Link href="/strategy" className="tp-btn-secondary">
              Get AI Strategy
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
