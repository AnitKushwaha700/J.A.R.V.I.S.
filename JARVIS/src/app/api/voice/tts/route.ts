import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Readable } from "stream";

// Edge-TTS voice options matching JARVIS personalities
export const VOICE_PROFILES: Record<string, string> = {
  jarvis: "en-US-ChristopherNeural",   // Crisp, authoritative, tech-focused
  friday: "en-US-JennyNeural",         // Friendly, warm, natural
  mentor: "en-GB-RyanNeural",          // British accent, professional interview mentor
  coach: "en-US-GuyNeural",            // Conversational English coach
  hindi: "en-IN-PrabhatNeural",        // Indian English accent
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const requestedVoice = typeof body.voice === "string" ? body.voice.toLowerCase() : "jarvis";

    if (!text) {
      return NextResponse.json({ error: "Text is required for speech synthesis." }, { status: 400 });
    }

    // Limit single turn synthesis length to prevent abuse (max 2000 chars per voice turn)
    const sanitizedText = text.slice(0, 2000);
    const voiceName = VOICE_PROFILES[requestedVoice] || process.env.EDGE_TTS_VOICE || "en-US-ChristopherNeural";

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(sanitizedText);

    // Convert Node Readable stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        audioStream.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        audioStream.on("end", () => {
          controller.close();
        });
        audioStream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        if (audioStream instanceof Readable) {
          audioStream.destroy();
        }
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Voice-Profile": voiceName,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "TTS synthesis failed";
    console.error("[TTS Error]:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
