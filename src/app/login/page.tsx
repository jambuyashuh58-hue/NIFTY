"use client";

export const dynamic = "force-dynamic";       // do not prerender this page
export const fetchCache = "force-no-store";   // optional: avoid caching on login

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/** Top-level page: wrap the form (which uses useSearchParams) in Suspense */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

/** Lightweight fallback while the client boundary hydrates */
function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-trading-green/10 border border-trading-green/30 mb-4" />
          <div className="h-4 w-40 mx-auto bg-panel-bg rounded mb-2" />
          <div className="h-3 w-52 mx-auto bg-panel-bg rounded opacity-70" />
        </div>
        <div className="tp-card p-6">
          <div className="h-4 w-56 bg-panel-bg rounded mb-6" />
          <div className="space-y-4">
            <div className="h-10 w-full bg-panel-bg rounded" />
            <div className="h-10 w-full bg-panel-bg rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Actual login form (safe place to use useSearchParams) */
function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();           // <-- allowed inside Suspense
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Login failed. Please try again.");
        setPassword("");
        inputRef.current?.focus();
        return;
      }

      toast.success("Welcome back! Loading your dashboard...");
      const from = searchParams.get("from") ?? "/";
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      {/* Background grid decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00d97e 1px, transparent 1px), linear-gradient(90deg, #00d97e 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-trading-green/10 border border-trading-green/30 mb-4">
            <TrendingUp className="w-7 h-7 text-trading-green" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary-text">
            Trade<span className="text-trading-green">Pulse</span>
          </h1>
          <p className="text-sm text-muted-text mt-1">Your personal trading brain</p>
        </div>

        {/* Login card */}
        <div className="tp-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-muted-text" />
            <span className="text-sm font-medium text-secondary-text">
              Enter your password to continue
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Password field */}
            <div>
              <label className="block text-xs text-muted-text mb-1.5 font-medium uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full bg-panel-bg border border-border-color rounded-lg px-4 py-3 pr-10 text-sm text-primary-text placeholder:text-muted-text/50 focus:outline-none focus:border-trading-green/50 focus:ring-1 focus:ring-trading-green/30 transition-all disabled:opacity-50 font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-secondary-text transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-trading-red/10 border border-trading-red/30 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-trading-red flex-shrink-0" />
                <p className="text-xs text-trading-red">{error}</p>
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-trading-green/90 hover:bg-trading-green text-app-bg font-semibold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Unlock TradePulse
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-xs text-muted-text mt-4">
            Default password:{" "}
            <code className="bg-card-bg px-1.5 py-0.5 rounded text-accent-indigo font-mono">
              tradepulse123
            </code>
          </p>
          <p className="text-center text-xs text-muted-text mt-1">
            Change it in <code className="font-mono">.env.local</code> via{" "}
            <code className="font-mono">APP_PASSWORD</code>
          </p>
        </div>

        {/* Security note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-text">
            🔒 Protected with HTTP-only session cookies. Session lasts 7 days.
          </p>
        </div>
      </div>
    </div>
  );
}
