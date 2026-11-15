import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITask extends Document {
  sessionId: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed" | "skipped";
  priority: "low" | "medium" | "high";
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "skipped"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueAt: { type: Date },
  },
  { timestamps: true }
);

TaskSchema.index({ sessionId: 1, status: 1, dueAt: 1 });
TaskSchema.index({ sessionId: 1, createdAt: -1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
