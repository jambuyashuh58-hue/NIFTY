"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Plus, Upload, Trash2, RefreshCw, Search,
  TrendingUp, TrendingDown, Download, X, ChevronDown
} from "lucide-react";
import { useTradePulseStore, getTotalPnL, getTotalInvested, getTotalValue } from "@/lib/store";
import { computePosition, formatINR, formatINRCompact, formatPercent, formatPrice, genId, parseGrowwCSV, pnlColor } from "@/lib/utils";
import type { Position, AssetType, Broker } from "@/lib/types";
import { clsx } from "clsx";
import toast from "react-hot-toast";

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "stock", label: "Stock / Equity" },
  { value: "options", label: "Options (CE/PE)" },
  { value: "futures", label: "Futures" },
  { value: "mutualfund", label: "Mutual Fund" },
  { value: "commodity", label: "Commodity" },
];

const BROKERS: { value: Broker; label: string }[] = [
  { value: "groww", label: "Groww" },
  { value: "zerodha", label: "Zerodha" },
  { value: "angelone", label: "Angel One" },
  { value: "upstox", label: "Upstox" },
  { value: "manual", label: "Manual Entry" },
];

// ─── Add Position Form ────────────────────────────────────────────────────────
function AddPositionForm({ onClose }: { onClose: () => void }) {
  const { addPosition } = useTradePulseStore();
  const [form, setForm] = useState({
    symbol: "", displayName: "", assetType: "stock" as AssetType,
    broker: "groww" as Broker, quantity: "", avgBuyPrice: "", currentPrice: "",
    expiryDate: "", optionType: "CE", strikePrice: "", lotSize: "1",
  });

  const f = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleAdd = () => {
    if (!form.symbol || !form.quantity || !form.avgBuyPrice) {
      toast.error("Symbol, quantity and buy price are required");
      return;
    }
    const pos = computePosition({
      id: genId(),
      symbol: form.symbol.toUpperCase(),
      displayName: form.displayName || form.symbol.toUpperCase(),
      assetType: form.assetType,
      broker: form.broker,
      quantity: parseFloat(form.quantity),
      avgBuyPrice: parseFloat(form.avgBuyPrice),
      currentPrice: parseFloat(form.currentPrice || form.avgBuyPrice),
      lastUpdated: new Date().toISOString(),
      ...(form.assetType === "options" && {
        optionType: form.optionType as "CE" | "PE",
        strikePrice: parseFloat(form.strikePrice),
        expiryDate: form.expiryDate,
        lotSize: parseInt(form.lotSize),
      }),
    });
    addPosition(pos);
    toast.success(`Added ${pos.symbol}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-border-color rounded-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
          <h2 className="font-semibold text-primary-text">Add Position</h2>
          <button onClick={onClose} className="text-muted-text hover:text-primary-text">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-text mb-1 block">Symbol *</label>
              <input className="tp-input" placeholder="e.g. RELIANCE" value={form.symbol}
                onChange={(e) => f("symbol", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="text-xs text-muted-text mb-1 block">Display Name</label>
              <input className="tp-input" placeholder="Optional" value={form.displayName}
                onChange={(e) => f("displayName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-text mb-1 block">Asset Type *</label>
              <select className="tp-select" value={form.assetType}
                onChange={(e) => f("assetType", e.target.value)}>
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-text mb-1 block">Broker</label>
              <select className="tp-select" value={form.broker}
                onChange={(e) => f("broker", e.target.value)}>
                {BROKERS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-text mb-1 block">Quantity *</label>
              <input className="tp-input" type="number" placeholder="0" value={form.quantity}
                onChange={(e) => f("quantity", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-text mb-1 block">Avg Buy Price *</label>
              <input className="tp-input" type="number" placeholder="₹0.00" value={form.avgBuyPrice}
                onChange={(e) => f("avgBuyPrice", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-text mb-1 block">Current Price</label>
              <input className="tp-input" type="number" placeholder="Same as buy" value={form.currentPrice}
                onChange={(e) => f("currentPrice", e.target.value)} />
            </div>
          </div>

          {form.assetType === "options" && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-color">
              <div>
                <label className="text-xs text-muted-text mb-1 block">Option Type</label>
                <select className="tp-select" value={form.optionType}
                  onChange={(e) => f("optionType", e.target.value)}>
                  <option>CE</option>
                  <option>PE</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-text mb-1 block">Strike Price</label>
                <input className="tp-input" type="number" value={form.strikePrice}
                  onChange={(e) => f("strikePrice", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-text mb-1 block">Lot Size</label>
                <input className="tp-input" type="number" value={form.lotSize}
                  onChange={(e) => f("lotSize", e.target.value)} />
              </div>
              <div className="col-span-3">
                <label className="text-xs text-muted-text mb-1 block">Expiry Date</label>
                <input className="tp-input" type="date" value={form.expiryDate}
                  onChange={(e) => f("expiryDate", e.target.value)} />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border-color">
          <button onClick={onClose} className="tp-btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} className="tp-btn-primary flex-1">Add Position</button>
        </div>
      </div>
    </div>
  );
}

// ─── Groww CSV Dropzone ───────────────────────────────────────────────────────
function GrowwImport({ onClose }: { onClose: () => void }) {
  const { setPositions, positions } = useTradePulseStore();
  const [parsed, setParsed] = useState<Position[]>([]);
  const [error, setError] = useState("");

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseGrowwCSV(text);
        if (result.length === 0) {
          setError("No positions found. Make sure you export the P&L / Holdings CSV from Groww.");
          return;
        }
        setParsed(result);
        setError("");
      } catch (err) {
        setError("Failed to parse CSV. Please try again.");
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1,
  });

  const handleImport = () => {
    const merged = [...positions.filter((p) => p.broker !== "groww"), ...parsed];
    setPositions(merged);
    toast.success(`Imported ${parsed.length} Groww positions`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-border-color rounded-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
          <h2 className="font-semibold text-primary-text">Import from Groww</h2>
          <button onClick={onClose} className="text-muted-text hover:text-primary-text">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-panel-bg rounded-lg p-3 text-xs text-muted-text space-y-1">
            <div className="font-medium text-primary-text mb-1">How to export from Groww:</div>
            <div>1. Open Groww app → Portfolio</div>
            <div>2. Tap &#39;...&#39; menu → Download / Export</div>
            <div>3. Download P&amp;L or Holdings CSV</div>
            <div>4. Drop the CSV file here</div>
          </div>

          <div
            {...getRootProps()}
            className={clsx(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive
                ? "border-accent bg-accent/5"
                : "border-border-bright hover:border-accent/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-muted-text mx-auto mb-3" />
            {isDragActive ? (
              <p className="text-sm text-accent">Drop it here...</p>
            ) : (
              <>
                <p className="text-sm text-primary-text">Drop your Groww CSV here</p>
                <p className="text-xs text-muted-text mt-1">or click to browse</p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-trading-red/10 border border-trading-red/30 rounded-lg p-3 text-sm text-trading-red">
              {error}
            </div>
          )}

          {parsed.length > 0 && (
            <div className="bg-trading-green/10 border border-trading-green/30 rounded-lg p-3">
              <div className="text-sm text-trading-green font-medium mb-2">
                ✓ Found {parsed.length} positions
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {parsed.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs text-muted-text">
                    <span>{p.symbol}</span>
                    <span className={pnlColor(p.pnl)}>{formatINR(p.pnl)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border-color">
          <button onClick={onClose} className="tp-btn-secondary flex-1">Cancel</button>
          <button onClick={handleImport} disabled={parsed.length === 0}
            className={clsx("flex-1", parsed.length > 0 ? "tp-btn-primary" : "tp-btn-secondary opacity-50")}>
            Import {parsed.length > 0 ? `${parsed.length} Positions` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Page ───────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { positions, removePosition, updatePrices } = useTradePulseStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const totalPnL = getTotalPnL(positions);
  const totalInvested = getTotalInvested(positions);
  const totalValue = getTotalValue(positions);

  const filtered = positions.filter(
    (p) =>
      p.symbol.toLowerCase().includes(search.toLowerCase()) ||
      p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const symbols = positions.filter((p) => p.assetType === "stock").map((p) => p.symbol);
    if (symbols.length > 0) {
      try {
        const res = await fetch("/api/market", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols }),
        });
        const data = await res.json();
        if (data.prices) {
          updatePrices(data.prices);
          toast.success("Prices refreshed");
        }
      } catch {
        toast.error("Could not refresh prices");
      }
    }
    setRefreshing(false);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showAdd && <AddPositionForm onClose={() => setShowAdd(false)} />}
      {showImport && <GrowwImport onClose={() => setShowImport(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-primary-text">Portfolio</h1>
          <p className="text-sm text-muted-text mt-0.5">{positions.length} positions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="tp-btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button onClick={() => setShowImport(true)}
            className="tp-btn-secondary flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            Import Groww CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            className="tp-btn-primary flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            Add Position
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Invested", value: formatINR(totalInvested), sub: "", color: "text-primary-text" },
          { label: "Current Value", value: formatINR(totalValue), sub: "", color: "text-primary-text" },
          {
            label: "Open P&L", value: `${totalPnL >= 0 ? "+" : ""}${formatINR(totalPnL)}`,
            sub: formatPercent((totalInvested > 0 ? totalPnL / totalInvested : 0) * 100),
            color: totalPnL >= 0 ? "text-trading-green" : "text-trading-red"
          },
          { label: "Positions", value: `${positions.length}`, sub: `${positions.filter(p => p.pnl > 0).length}W / ${positions.filter(p => p.pnl < 0).length}L`, color: "text-primary-text" },
        ].map((c) => (
          <div key={c.label} className="tp-card">
            <div className="text-xs text-muted-text mb-1">{c.label}</div>
            <div className={clsx("font-mono font-bold text-lg", c.color)}>{c.value}</div>
            {c.sub && <div className={clsx("text-xs font-mono mt-0.5", c.color, "opacity-70")}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
        <input
          className="tp-input pl-9"
          placeholder="Search positions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="tp-card text-center py-16">
          <div className="w-12 h-12 rounded-full bg-panel-bg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-muted-text" />
          </div>
          <p className="text-muted-text text-sm">
            {positions.length === 0
              ? "No positions yet. Import your Groww CSV or add manually."
              : "No positions match your search."}
          </p>
        </div>
      ) : (
        <div className="tp-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                {["Symbol", "Type", "Broker", "Qty", "Avg Buy", "LTP", "Invested", "Value", "P&L", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] text-muted-text uppercase tracking-wider px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border-color last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-primary-text">{p.displayName}</div>
                    {p.optionType && (
                      <div className="text-[10px] text-muted-text">
                        {p.optionType} · {p.strikePrice} · {p.expiryDate}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="tp-badge-dim text-[10px]">{p.assetType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="tp-badge-blue text-[10px]">{p.broker}</span>
                  </td>
                  <td className="px-4 py-3 num text-sm text-muted-text">{p.quantity}</td>
                  <td className="px-4 py-3 num text-sm text-muted-text">₹{formatPrice(p.avgBuyPrice)}</td>
                  <td className="px-4 py-3 num text-sm text-primary-text">₹{formatPrice(p.currentPrice)}</td>
                  <td className="px-4 py-3 num text-sm text-muted-text">{formatINRCompact(p.investedAmount)}</td>
                  <td className="px-4 py-3 num text-sm text-primary-text">{formatINRCompact(p.currentValue)}</td>
                  <td className="px-4 py-3">
                    <div className={clsx("num text-sm font-semibold", p.pnl >= 0 ? "text-trading-green" : "text-trading-red")}>
                      {p.pnl >= 0 ? "+" : ""}{formatINR(p.pnl)}
                    </div>
                    <div className={clsx("num text-[10px]", p.pnl >= 0 ? "text-trading-green" : "text-trading-red")}>
                      {formatPercent(p.pnlPercent)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => {
                      removePosition(p.id);
                      toast.success(`Removed ${p.symbol}`);
                    }} className="text-muted-text hover:text-trading-red transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
