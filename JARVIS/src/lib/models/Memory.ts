import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMemory extends Document {
  sessionId: string;
  category: "preference" | "career_goal" | "learning_fact" | "tech_skill" | "mistake_pattern";
  key: string;
  value: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ["preference", "career_goal", "learning_fact", "tech_skill", "mistake_pattern"],
      default: "learning_fact",
      index: true,
    },
    key: { type: String, required: true, trim: true, maxlength: 120 },
    value: { type: String, required: true, trim: true, maxlength: 2000 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MemorySchema.index({ sessionId: 1, key: 1 }, { unique: true });
MemorySchema.index({ sessionId: 1, category: 1 });

export const Memory: Model<IMemory> =
  mongoose.models.Memory || mongoose.model<IMemory>("Memory", MemorySchema);
