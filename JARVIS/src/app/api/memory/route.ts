import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import connectToDatabase from "@/lib/db";
import { Memory } from "@/lib/models/Memory";
import { memoryCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    return NextResponse.json({ memories: [] });
  }

  try {
    const memories = await Memory.find({ sessionId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = memories.map((m) => ({
      id: m._id.toString(),
      sessionId: m.sessionId,
      category: m.category,
      key: m.key,
      value: m.value,
      isApproved: m.isApproved,
      createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: m.updatedAt ? m.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ memories: formatted });
  } catch (error) {
    console.error("Failed to fetch memories:", error);
    return NextResponse.json(
      { error: "Could not retrieve saved memories." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    return NextResponse.json({ error: "Database offline." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const result = memoryCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid memory data." },
        { status: 400 }
      );
    }

    const { category, key, value } = result.data;

    const memory = await Memory.findOneAndUpdate(
      { sessionId, key },
      { $set: { category, value, isApproved: true } },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        memory: {
          id: memory._id.toString(),
          sessionId: memory.sessionId,
          category: memory.category,
          key: memory.key,
          value: memory.value,
          isApproved: memory.isApproved,
          createdAt: memory.createdAt.toISOString(),
          updatedAt: memory.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save memory:", error);
    return NextResponse.json(
      { error: "Could not save memory item." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    return NextResponse.json({ error: "Database offline." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required." }, { status: 400 });
    }

    await Memory.findOneAndDelete({ _id: id, sessionId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete memory:", error);
    return NextResponse.json({ error: "Could not delete memory." }, { status: 500 });
  }
}
