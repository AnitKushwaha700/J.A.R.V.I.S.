import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import connectToDatabase from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    return NextResponse.json({ conversations: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const conv = await Conversation.findOne({ _id: id, sessionId }).lean();
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }

      const formattedMessages = (conv.messages || []).map((m) => ({
        id: (m as { _id?: unknown })._id?.toString() || Math.random().toString(),
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      }));

      return NextResponse.json({
        conversation: {
          id: conv._id.toString(),
          title: (conv.messages?.[0]?.text || "Conversation").slice(0, 80),
          mode: conv.mode,
          createdAt: conv.createdAt ? new Date(conv.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: conv.updatedAt ? new Date(conv.updatedAt).toISOString() : new Date().toISOString(),
        },
        messages: formattedMessages,
      });
    }

    const conversations = await Conversation.find({ sessionId })
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    const formattedList = conversations.map((c) => ({
      id: c._id.toString(),
      title: (c.messages?.[0]?.text || "New conversation").replace(/\s+/g, " ").slice(0, 80),
      mode: c.mode,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ conversations: formattedList });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Conversation history unavailable." },
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
    const body = (await request.json().catch(() => ({}))) as {
      all?: boolean;
      id?: string;
    };

    if (body.all === true) {
      await Conversation.deleteMany({ sessionId });
      return NextResponse.json({ deleted: true });
    }

    if (body.id) {
      const deleted = await Conversation.findOneAndDelete({ _id: body.id, sessionId });
      if (!deleted) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: "Provide a valid conversation id or set all: true." }, { status: 400 });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return NextResponse.json(
      { error: "Could not delete conversation history." },
      { status: 500 }
    );
  }
}
