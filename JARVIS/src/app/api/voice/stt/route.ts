import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Groq API key is missing. Add GROQ_API_KEY to .env.local to use Whisper Large v3 Turbo, or fallback to native browser recognition.",
          code: "KEY_MISSING",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file is required in 'file' form-data field." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    // Groq SDK accepts Web File/Blob directly
    const transcription = await groq.audio.transcriptions.create({
      file: file as unknown as File,
      model: process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo",
      response_format: "verbose_json",
      temperature: 0.0,
    });

    return NextResponse.json({
      text: transcription.text?.trim() || "",
      language: (transcription as { language?: string }).language || "en",
      duration: (transcription as { duration?: number }).duration || 0,
      provider: "groq-whisper-turbo",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Whisper transcription failed";
    console.error("[Whisper STT Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
