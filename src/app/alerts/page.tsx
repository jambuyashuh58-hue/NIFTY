"use client";
import { useState } from "react";
import {
  Bell, Plus, Trash2, ToggleLeft, ToggleRight,
  Target, ShieldAlert, TrendingUp, TrendingDown,
  Clock, CheckCircle2, X, Zap
} from "lucide-react";
import { useTradePulseStore, getTotalPnL } from "@/lib/store";
import { formatINR, formatINRCompact, genId } from "@/lib/utils";
import type { AlertRule, AlertTriggerType } from "@/lib/types";
import { clsx } from "clsx";
import toast from "react-hot-toast";

const TRIGGER_TYPES: { value: AlertTriggerType; label: string; icon: any; desc: string }[] = [
  { value: "daily_profit_target", label: "Daily Profit Target", icon: Target, desc: "Fire when total P&L reaches your target" },
  { value: "daily_stop_loss", label: "Daily Stop Loss", icon: ShieldAlert, desc: "Fire when total loss exceeds limit" },
  { value: "position_profit", label: "Position Profit", icon: TrendingUp, desc: "Fire when a specific position hits profit" },
  { value: "position_loss", label: "Position Stop Loss", icon: TrendingDown, desc: "Fire when a specific position hits loss" },
];

function AddAlertModal({ onClose }: { onClose: () => void }) {
  const { addAlertRule, positions, settings } = useTradePulseStore();
  const [form, setForm] = useState({
    name: "",
    type: "daily_profit_target" as AlertTriggerType,
    targetAmount: settings.dailyProfitTarget.toString(),
    positionId: "",
    notifyBrowser: true,
    notifyWhatsApp: false,
  });

  const f = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name) {
      toast.error("Give your alert a name");
      return;
    }
    const rule: AlertRule = {
      id: genId(),
      name: form.name,
      type: form.type,
      isActive: true,
      createdAt: new Date().toISOString(),
      targetAmount: parseFloat(form.targetAmount) || 0,
      positionId: form.positionId || undefined,
      notifyBrowser: form.notifyBrowser,
      notifyWhatsApp: form.notifyWhatsApp,
      triggered: false,
    };
    addAlertRule(rule);
    toast.success("Alert created");
    onClose();
  };

  const selectedType = TRIGGER_TYPES.find((t) => t.value === form.type);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-border-color rounded-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
          <h2 className="font-semibold text-primary-text">New Alert Rule</h2>
          <button onClick={onClose} className="text-muted-text hover:text-primary-text">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-text mb-1 block">Alert Name *</label>
            <input className="tp-input" placeholder='e.g. "Hit daily target"'
              value={form.name} onChange={(e) => f("name", e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-muted-text mb-1 block">Trigger Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => f("type", t.value)}
                  className={clsx(
                    "flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all",
                    form.type === t.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-color bg-panel-bg text-muted-text hover:border-border-bright"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  <div className="text-xs font-medium">{t.label}</div>
                  <div className="text-[10px] opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-text mb-1 block">
              {form.type === "daily_profit_target" ? "Profit Target Amount (₹)" :
               form.type === "daily_stop_loss" ? "Stop Loss Amount (₹)" :
               "P&L Amount (₹)"}
            </label>
            <input className="tp-input" type="number" placeholder="2000"
              value={form.targetAmount} onChange={(e) => f("targetAmount", e.target.value)} />
            {form.type === "daily_profit_target" && (
              <div className="text-[10px] text-muted-text mt-1">
                Alert fires when total P&L reaches +₹{parseInt(form.targetAmount || "0").toLocaleString("en-IN")}
              </div>
            )}
            {form.type === "daily_stop_loss" && (
              <div className="text-[10px] text-muted-text mt-1">
                Alert fires when total loss exceeds -₹{parseInt(form.targetAmount || "0").toLocaleString("en-IN")}
              </div>
            )}
          </div>

          {(form.type === "position_profit" || form.type === "position_loss") && (
            <div>
              <label className="text-xs text-muted-text mb-1 block">Select Position</label>
              <select className="tp-select" value={form.positionId}
                onChange={(e) => f("positionId", e.target.value)}>
                <option value="">All positions (use total P&L)</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} — {formatINR(p.currentValue)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-text mb-2 block">Notifications</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.notifyBrowser}
                  onChange={(e) => f("notifyBrowser", e.target.checked)}
                  className="w-4 h-4 rounded accent-accent" />
                <div>
                  <div className="text-sm text-primary-text">Browser notification</div>
                  <div className="text-[10px] text-muted-text">Pop-up alert in browser</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.notifyWhatsApp}
                  onChange={(e) => f("notifyWhatsApp", e.target.checked)}
                  className="w-4 h-4 rounded accent-accent" />
                <div>
                  <div className="text-sm text-primary-text">WhatsApp message</div>
                  <div className="text-[10px] text-muted-text">Requires CallMeBot key in Settings</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border-color">
          <button onClick={onClose} className="tp-btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="tp-btn-primary flex-1">Save Alert</button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const {
    alertRules, firedAlerts, positions,
    removeAlertRule, toggleAlertRule, updateAlertRule, clearFiredAlerts
  } = useTradePulseStore();
  const [showAdd, setShowAdd] = useState(false);
  const totalPnL = getTotalPnL(positions);

  const resetAlert = (id: string) => {
    updateAlertRule(id, { triggered: false, triggeredAt: undefined });
    toast.success("Alert reset — it will fire again when triggered");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showAdd && <AddAlertModal onClose={() => setShowAdd(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-primary-text">Alerts</h1>
          <p className="text-sm text-muted-text mt-0.5">
            {alertRules.filter((r) => r.isActive).length} active rules
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="tp-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Alert
        </button>
      </div>

      {/* Current P&L status */}
      <div className="tp-card flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-xs text-muted-text">Current Total P&amp;L</div>
          <div className={clsx(
            "font-mono font-bold text-xl",
            totalPnL >= 0 ? "text-trading-green" : "text-trading-red"
          )}>
            {totalPnL >= 0 ? "+" : ""}{formatINR(totalPnL)}
          </div>
        </div>
        <div className="ml-auto text-xs text-muted-text">
          Alert engine checks every 30s
        </div>
      </div>

      {/* Alert rules */}
      <div>
        <div className="section-title">Alert Rules</div>
        {alertRules.length === 0 ? (
          <div className="tp-card text-center py-12">
            <Bell className="w-8 h-8 text-muted-text mx-auto mb-3" />
            <p className="text-sm text-muted-text">
              No alerts yet. Create your first rule to get notified when you hit targets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertRules.map((rule) => {
              const typeInfo = TRIGGER_TYPES.find((t) => t.value === rule.type);
              const Icon = typeInfo?.icon ?? Bell;
              return (
                <div key={rule.id}
                  className={clsx(
                    "tp-card flex items-center gap-4 transition-all",
                    rule.triggered && "border-trading-green/40 bg-trading-green/5",
                    !rule.isActive && "opacity-50"
                  )}
                >
                  <div className={clsx(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    rule.type === "daily_profit_target" ? "bg-trading-green/15 text-trading-green" :
                    rule.type === "daily_stop_loss" ? "bg-trading-red/15 text-trading-red" :
                    "bg-accent/15 text-accent"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-primary-text">{rule.name}</div>
                      {rule.triggered && (
                        <span className="tp-badge-green text-[10px]">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Fired
                        </span>
                      )}
                      {!rule.isActive && (
                        <span className="tp-badge-dim text-[10px]">Paused</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-text mt-0.5">
                      {typeInfo?.label} · Target: ₹{rule.targetAmount?.toLocaleString("en-IN")}
                      {rule.triggeredAt && ` · Fired at ${new Date(rule.triggeredAt).toLocaleTimeString("en-IN")}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {rule.triggered && (
                      <button onClick={() => resetAlert(rule.id)}
                        className="text-xs text-accent hover:underline">
                        Reset
                      </button>
                    )}
                    <button onClick={() => toggleAlertRule(rule.id)}
                      className={clsx(
                        "transition-colors",
                        rule.isActive ? "text-trading-green" : "text-muted-text"
                      )}>
                      {rule.isActive
                        ? <ToggleRight className="w-5 h-5" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => {
                      removeAlertRule(rule.id);
                      toast.success("Alert deleted");
                    }} className="text-muted-text hover:text-trading-red transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert history */}
      {firedAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-title mb-0">Alert History</div>
            <button onClick={clearFiredAlerts}
              className="text-xs text-muted-text hover:text-trading-red transition-colors">
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {firedAlerts.map((a) => (
              <div key={a.id} className="tp-card flex items-center gap-3 py-3">
                <div className="w-2 h-2 rounded-full bg-trading-yellow flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-primary-text">{a.message}</div>
                  <div className="text-[11px] text-muted-text mt-0.5">
                    {new Date(a.firedAt).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className={clsx(
                  "num text-sm font-semibold",
                  a.value >= 0 ? "text-trading-green" : "text-trading-red"
                )}>
                  {a.value >= 0 ? "+" : ""}{formatINR(a.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
