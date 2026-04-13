import { NextRequest, NextResponse } from "next/server";

// This route ONLY works locally with Ollama running on http://localhost:11434
// Won't work on Vercel (localhost is not accessible)

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Call local Ollama server
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama2",
        prompt: `Summarize this in 2-3 sentences: ${content}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Ollama server not running. Start with: ollama serve");
    }

    const data = await response.json();
    const summary = data.response || "";

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Make sure Ollama is running on localhost:11434",
        debug: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
