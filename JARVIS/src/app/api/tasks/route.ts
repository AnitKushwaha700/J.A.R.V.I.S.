import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import connectToDatabase from "@/lib/db";
import { Task } from "@/lib/models/Task";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    // Return empty array when DB is offline
    return NextResponse.json({ tasks: [] });
  }

  try {
    const tasks = await Task.find({ sessionId })
      .sort({ status: 1, dueAt: 1, createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = tasks.map((t) => ({
      id: t._id.toString(),
      sessionId: t.sessionId,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      priority: t.priority,
      dueAt: t.dueAt ? new Date(t.dueAt).toISOString() : null,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ tasks: formatted });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Tasks are temporarily unavailable." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    return NextResponse.json(
      { error: "Database is not connected. Configure MONGODB_URI in .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const result = taskCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid task data." },
        { status: 400 }
      );
    }

    const { title, description, priority, dueAt } = result.data;

    const task = new Task({
      sessionId,
      title,
      description: description || undefined,
      priority,
      status: "todo",
      dueAt: dueAt ? new Date(dueAt) : undefined,
    });
    await task.save();

    return NextResponse.json(
      {
        task: {
          id: task._id.toString(),
          sessionId: task.sessionId,
          title: task.title,
          description: task.description ?? null,
          status: task.status,
          priority: task.priority,
          dueAt: task.dueAt ? task.dueAt.toISOString() : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "The task could not be saved." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const sessionId = await getOrCreateSessionId();
  const db = await connectToDatabase();

  if (!db) {
    return NextResponse.json({ error: "Database offline." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const result = taskUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const { id, title, description, status, priority, dueAt } = result.data;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || undefined;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : undefined;

    const updated = await Task.findOneAndUpdate(
      { _id: id, sessionId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({
      task: {
        id: updated._id.toString(),
        sessionId: updated.sessionId,
        title: updated.title,
        description: updated.description ?? null,
        status: updated.status,
        priority: updated.priority,
        dueAt: updated.dueAt ? updated.dueAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "The task could not be updated." },
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
    const clearCompleted = searchParams.get("clearCompleted");

    if (clearCompleted === "true") {
      await Task.deleteMany({ sessionId, status: "completed" });
      return NextResponse.json({ success: true, message: "Completed tasks removed." });
    }

    if (!id) {
      return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
    }

    const deleted = await Task.findOneAndDelete({ _id: id, sessionId });
    if (!deleted) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
