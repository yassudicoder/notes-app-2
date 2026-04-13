import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("[AI API] POST request received");
  
  try {
    // Parse request
    let content: string;
    try {
      const body = await request.json();
      content = body.content;
      console.log(`[AI API] Parsed request - Content length: ${content?.length || 0} chars`);
    } catch (parseError) {
      console.error("[AI API] JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      console.warn("[AI API] Invalid content - empty or not string");
      return NextResponse.json(
        { error: "Note content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[AI API] GROQ_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI service is not configured. Please add GROQ_API_KEY to environment variables." },
        { status: 500 }
      );
    }
    
    console.log("[AI API] API key found - proceeding with Groq API call");

    // Call Groq API with Llama 3.3
    console.log("[AI API] Calling Groq API...");
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
    
    console.log(`[AI API] Groq API response status: ${groqResponse.status}`);

    // Handle Groq API errors
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error("[AI API] Groq API error response:", {
        status: groqResponse.status,
        statusText: groqResponse.statusText,
        data: errorData,
      });

      // Handle rate limiting
      if (groqResponse.status === 429) {
        console.warn("[AI API] Rate limited (429)");
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment before trying again." },
          { status: 429 }
        );
      }

      // Handle model errors
      if (groqResponse.status === 404) {
        console.warn("[AI API] Model not available (404)");
        return NextResponse.json(
          { error: "AI model not available. Please try again later." },
          { status: 503 }
        );
      }

      // Generic API error
      const errorMessage = 
        errorData?.error?.message || 
        `Groq API error (${groqResponse.status}): ${groqResponse.statusText}`;

      console.error(`[AI API] Returning error to client: ${errorMessage}`);
      return NextResponse.json(
        { error: errorMessage },
        { status: groqResponse.status }
      );
    }

    // Extract summary
    const data = await groqResponse.json();
    console.log("[AI API] Groq API response received - checking format");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("[AI API] Unexpected Groq API response format:", data);
      return NextResponse.json(
        { error: "Unexpected response from AI service" },
        { status: 500 }
      );
    }

    const summary = data.choices[0].message.content?.trim() || "";
    console.log(`[AI API] Extracted summary - length: ${summary.length} chars`);
    
    if (!summary) {
      console.error("[AI API] Summary is empty after extraction");
      return NextResponse.json(
        { error: "AI service returned empty summary" },
        { status: 500 }
      );
    }

    console.log("[AI API] Successfully returning summary to client");
    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("[AI API] Unexpected error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    // Network errors
    if (error?.message?.includes("fetch")) {
      console.error("[AI API] Network error detected");
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
