import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await connectToDatabase();
    return NextResponse.json({
      ok: Boolean(db),
      database: db ? "connected" : "memory_fallback",
      aiProvider: Boolean(process.env.XAI_API_KEY) ? "grok" : Boolean(process.env.GEMINI_API_KEY) ? "gemini" : "offline",
      model: process.env.XAI_MODEL || "grok-4.7",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
