import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "TradePulse — Your Trading Brain",
  description: "Unified Indian trading dashboard: multi-broker P&L, AI strategy, smart exit alerts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-app-bg">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#141b22",
              color: "#e2e8f0",
              border: "1px solid #1f2d3d",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#00d97e", secondary: "#141b22" } },
            error: { iconTheme: { primary: "#ff4560", secondary: "#141b22" } },
          }}
        />
      </body>
    </html>
  );
}
