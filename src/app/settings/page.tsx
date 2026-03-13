"use client";
import { useState } from "react";
import { Settings, Bell, DollarSign, Phone, Save, Info } from "lucide-react";
import { useTradePulseStore } from "@/lib/store";
import { clsx } from "clsx";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { settings, updateSettings } = useTradePulseStore();
  const [form, setForm] = useState({ ...settings });
  const f = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const notif = (k: string, v: boolean) =>
    setForm((p) => ({ ...p, notifications: { ...p.notifications, [k]: v } }));

  const handleSave = () => {
    updateSettings(form);
    toast.success("Settings saved");
  };

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser doesn't support notifications");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") toast.success("Browser notifications enabled!");
    else toast.error("Permission denied");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display text-xl font-bold text-primary-text flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          Settings
        </h1>
        <p className="text-sm text-muted-text mt-0.5">Configure your trading preferences</p>
      </div>

      {/* Daily Targets */}
      <div className="tp-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-trading-green" />
          <div className="font-semibold text-sm text-primary-text">Daily Trading Targets</div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-text mb-1 block">
              Daily Profit Target (₹)
            </label>
            <input type="number" className="tp-input" value={form.dailyProfitTarget}
              onChange={(e) => f("dailyProfitTarget", parseInt(e.target.value))} />
            <div className="text-[10px] text-muted-text mt-1">Alert fires at this profit</div>
          </div>
          <div>
            <label className="text-xs text-muted-text mb-1 block">
              Daily Stop Loss (₹)
            </label>
            <input type="number" className="tp-input" value={form.dailyStopLoss}
              onChange={(e) => f("dailyStopLoss", parseInt(e.target.value))} />
            <div className="text-[10px] text-muted-text mt-1">Alert fires at this loss</div>
          </div>
          <div>
            <label className="text-xs text-muted-text mb-1 block">
              Capital to Deploy (₹)
            </label>
            <input type="number" className="tp-input" value={form.capitalDeployed}
              onChange={(e) => f("capitalDeployed", parseInt(e.target.value))} />
            <div className="text-[10px] text-muted-text mt-1">Used by AI strategy</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="tp-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-trading-yellow" />
          <div className="font-semibold text-sm text-primary-text">Notifications</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border-color">
            <div>
              <div className="text-sm text-primary-text">Browser notifications</div>
              <div className="text-xs text-muted-text">Pop-up alerts in your browser</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={requestNotifPermission}
                className="text-xs text-accent hover:underline">
                Request permission
              </button>
              <input type="checkbox"
                checked={form.notifications.browser}
                onChange={(e) => notif("browser", e.target.checked)}
                className="w-4 h-4 rounded accent-accent" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border-color">
            <div>
              <div className="text-sm text-primary-text">Sound alerts</div>
              <div className="text-xs text-muted-text">Play a sound when alert fires</div>
            </div>
            <input type="checkbox"
              checked={form.notifications.sound}
              onChange={(e) => notif("sound", e.target.checked)}
              className="w-4 h-4 rounded accent-accent" />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm text-primary-text">WhatsApp alerts</div>
              <div className="text-xs text-muted-text">Send alerts to your WhatsApp (via CallMeBot)</div>
            </div>
            <input type="checkbox"
              checked={form.notifications.whatsapp}
              onChange={(e) => notif("whatsapp", e.target.checked)}
              className="w-4 h-4 rounded accent-accent" />
          </div>
        </div>
      </div>

      {/* WhatsApp / CallMeBot */}
      <div className="tp-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-4 h-4 text-trading-green" />
          <div className="font-semibold text-sm text-primary-text">WhatsApp Setup (Free)</div>
        </div>

        <div className="bg-panel-bg rounded-lg p-3 text-xs text-muted-text space-y-1">
          <div className="flex items-start gap-1.5">
            <Info className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-primary-text mb-1">How to set up free WhatsApp alerts:</div>
              <div>1. Send &quot;I allow callmebot to send me messages&quot; to +34 603 21 25 97 on WhatsApp</div>
              <div>2. You&apos;ll receive an API key via WhatsApp</div>
              <div>3. Enter your WhatsApp number and the API key below</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-text mb-1 block">
              WhatsApp Number (with country code)
            </label>
            <input className="tp-input" placeholder="+919876543210"
              value={form.whatsappNumber}
              onChange={(e) => f("whatsappNumber", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-text mb-1 block">
              CallMeBot API Key
            </label>
            <input className="tp-input" placeholder="Your API key"
              value={form.callMeBotKey}
              onChange={(e) => f("callMeBotKey", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Anthropic API Key note */}
      <div className="tp-card">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-primary-text mb-1">
              AI Strategy Setup
            </div>
            <div className="text-xs text-muted-text leading-relaxed">
              The AI Strategy feature requires an Anthropic API key.
              Add it to your <code className="text-accent bg-panel-bg px-1 py-0.5 rounded">.env.local</code> file:
              <br /><br />
              <code className="text-trading-green bg-panel-bg px-2 py-1 rounded block mt-1">
                ANTHROPIC_API_KEY=sk-ant-...
              </code>
              <br />
              Get your key at console.anthropic.com
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="tp-btn-primary w-full flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        Save Settings
      </button>
    </div>
  );
}
