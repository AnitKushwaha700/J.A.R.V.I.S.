import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInterviewAttempt {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  starBreakdown?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  missingConcepts?: string[];
  strongerSampleAnswer?: string;
  answeredAt: Date;
}

export interface IInterviewSession extends Document {
  sessionId: string;
  role: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "in_progress" | "completed";
  questions: IInterviewAttempt[];
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  preparationPlan?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InterviewAttemptSubSchema = new Schema(
  {
    question: { type: String, required: true },
    userAnswer: { type: String, required: true },
    score: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
    starBreakdown: {
      situation: { type: String, default: "" },
      task: { type: String, default: "" },
      action: { type: String, default: "" },
      result: { type: String, default: "" },
    },
    missingConcepts: [{ type: String }],
    strongerSampleAnswer: { type: String },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const InterviewSessionSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    role: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      index: true,
    },
    questions: [InterviewAttemptSubSchema],
    overallScore: { type: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    preparationPlan: [{ type: String }],
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ sessionId: 1, createdAt: -1 });

export const InterviewSession: Model<IInterviewSession> =
  mongoose.models.InterviewSession ||
  mongoose.model<IInterviewSession>("InterviewSession", InterviewSessionSchema);
