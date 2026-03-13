import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DailyStrategy } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      profitTarget = 2000,
      stopLoss = 1000,
      capital = 50000,
      indices = [],
      date = new Date().toISOString().split("T")[0],
    } = body;

    // Format index data for prompt
    const indexSummary = indices
      .map(
        (idx: any) =>
          `${idx.name}: ₹${idx.price.toFixed(0)} (${idx.change >= 0 ? "+" : ""}${idx.changePercent.toFixed(2)}%)`
      )
      .join("\n");

    const prompt = `You are TradePulse AI, a market analysis assistant for Indian retail traders. Today is ${date} (IST).

Current Indian market data:
${indexSummary || "NIFTY 50, SENSEX, BANK NIFTY data unavailable"}

Trader's profile:
- Daily profit target: ₹${profitTarget}
- Daily stop loss limit: ₹${stopLoss}
- Capital available to deploy today: ₹${capital.toLocaleString("en-IN")}

Please generate a concise morning strategy brief. Respond ONLY with valid JSON in this exact format:
{
  "marketSentiment": "bullish" | "bearish" | "neutral" | "volatile",
  "summary": "2-3 sentence overview of today's market setup and key themes",
  "keyLevels": [
    { "label": "NIFTY Support", "value": 24500 },
    { "label": "NIFTY Resistance", "value": 25100 },
    { "label": "Bank NIFTY Support", "value": 52000 },
    { "label": "Bank NIFTY Resistance", "value": 53500 }
  ],
  "suggestedCapital": 30000,
  "riskNote": "One specific risk or caution for today in 1 sentence",
  "sectors": [
    { "name": "Banking", "trend": "up" },
    { "name": "IT", "trend": "neutral" },
    { "name": "Auto", "trend": "down" }
  ],
  "topWatchlist": ["NIFTY", "BANKNIFTY", "RELIANCE"]
}

Important: suggestedCapital should be between 20% and 80% of the trader's capital (₹${capital}). Keep it realistic. Do not provide financial advice — this is market analysis only.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);

    const strategy: DailyStrategy = {
      date,
      generatedAt: new Date().toISOString(),
      marketSentiment: parsed.marketSentiment ?? "neutral",
      summary: parsed.summary ?? "Market analysis unavailable.",
      keyLevels: parsed.keyLevels ?? [],
      suggestedCapital: parsed.suggestedCapital ?? capital * 0.5,
      riskNote: parsed.riskNote ?? "Always use a stop loss.",
      sectors: parsed.sectors ?? [],
      topWatchlist: parsed.topWatchlist ?? [],
      rawResponse: rawText,
    };

    return NextResponse.json({ strategy, ok: true });
  } catch (err: any) {
    console.error("Strategy API error:", err);

    // Return a sensible fallback
    const fallback: DailyStrategy = {
      date: new Date().toISOString().split("T")[0],
      generatedAt: new Date().toISOString(),
      marketSentiment: "neutral",
      summary:
        "AI strategy unavailable. Check your ANTHROPIC_API_KEY in .env.local. Markets are range-bound — wait for clear breakout signals before deploying capital.",
      keyLevels: [
        { label: "NIFTY Support", value: 24400 },
        { label: "NIFTY Resistance", value: 25000 },
        { label: "Bank NIFTY Support", value: 52000 },
        { label: "Bank NIFTY Resistance", value: 53500 },
      ],
      suggestedCapital: 25000,
      riskNote: "Configure ANTHROPIC_API_KEY to get live AI strategy.",
      sectors: [
        { name: "Banking", trend: "neutral" },
        { name: "IT", trend: "neutral" },
        { name: "Auto", trend: "neutral" },
      ],
      topWatchlist: ["NIFTY 50", "BANK NIFTY", "SENSEX"],
      rawResponse: err.message,
    };

    return NextResponse.json({ strategy: fallback, ok: false });
  }
}
