import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse request
    let content: string;
    try {
      const body = await request.json();
      content = body.content;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not configured in environment variables");
      return NextResponse.json(
        { error: "AI service is not configured. Please add GROQ_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    // Call Groq API with Llama 3.3
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise, clear summaries of notes.",
          },
          {
            role: "user",
            content: `Provide a concise summary (2-3 sentences max) of this note:\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 1,
        stream: false,
      }),
    });

    // Handle Groq API errors
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error("Groq API error response:", {
        status: groqResponse.status,
        statusText: groqResponse.statusText,
        data: errorData,
      });

      // Handle rate limiting
      if (groqResponse.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment before trying again." },
          { status: 429 }
        );
      }

      // Handle model errors
      if (groqResponse.status === 404) {
        return NextResponse.json(
          { error: "AI model not available. Please try again later." },
          { status: 503 }
        );
      }

      // Generic API error
      const errorMessage = 
        errorData?.error?.message || 
        `Groq API error (${groqResponse.status}): ${groqResponse.statusText}`;

      return NextResponse.json(
        { error: errorMessage },
        { status: groqResponse.status }
      );
    }

    // Extract summary
    const data = await groqResponse.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected Groq API response format:", data);
      return NextResponse.json(
        { error: "Unexpected response from AI service" },
        { status: 500 }
      );
    }

    const summary = data.choices[0].message.content?.trim() || "";
    
    if (!summary) {
      return NextResponse.json(
        { error: "AI service returned empty summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("Summarization endpoint error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    // Network errors
    if (error?.message?.includes("fetch")) {
      return NextResponse.json(
        { error: "Network error. Please check your connection." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to summarize note. Please try again." },
      { status: 500 }
    );
  }
}
