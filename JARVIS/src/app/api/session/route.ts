import { NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        ready: true,
        sessionId,
        level: "A1",
        streak: 0,
        totalMinutes: 0,
        xp: 0,
        aiConfigured: Boolean(process.env.XAI_API_KEY || process.env.GEMINI_API_KEY),
        model: process.env.XAI_MODEL?.trim() || "grok-4.7",
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Find or create user
    const user = await User.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          level: "A1",
          streak: 0,
          totalMinutes: 0,
          xp: 0,
        },
        $set: { lastActiveAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      ready: true,
      sessionId: user.sessionId,
      level: user.level,
      streak: user.streak,
      totalMinutes: user.totalMinutes,
      xp: user.xp,
      aiConfigured: Boolean(process.env.XAI_API_KEY || process.env.GEMINI_API_KEY),
      model: process.env.XAI_MODEL?.trim() || "grok-4.7",
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
