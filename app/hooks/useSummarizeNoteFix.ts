/**
 * FIXED SUMMARIZE FUNCTION
 * 
 * To use in your dashboard, replace the summarizeNote function with this:
 */

import { useCallback } from "react";

// Example usage in your component:
export function useSummarizeNoteFix() {
  const summarizeNote = useCallback(
    async (id: string, content: string, setSummarizingId: any, setSummaries: any, setError: any) => {
      // ===== VALIDATION =====
      if (!id || !content?.trim()) {
        console.error("[Summarize] Invalid parameters:", { id, contentLength: content?.length });
        setError("Invalid note content");
        return;
      }

      // ===== START STATE =====
      console.log(`[Summarize] Starting for note ${id}, content length: ${content.length}`);
      setSummarizingId(id);
      setError(null);

      try {
        // ===== API CALL =====
        console.log(`[Summarize] Calling /api/ai endpoint...`);
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });

        // Log response status
        console.log(`[Summarize] API response status: ${response.status}`);

        // ===== ERROR HANDLING =====
        if (!response.ok) {
          let errorMessage = `API Error (${response.status})`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error(`[Summarize] API error response:`, errorData);
          } catch (parseError) {
            console.error(`[Summarize] Could not parse error response:`, parseError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          setError(`Summarization failed: ${errorMessage}`);
          console.error(`[Summarize] Setting error state:`, errorMessage);
          return;
        }

        // ===== PARSE RESPONSE =====
        let data;
        try {
          data = await response.json();
          console.log(`[Summarize] Parsed response:`, data);
        } catch (parseError) {
          const msg = "Failed to parse API response";
          console.error(`[Summarize] ${msg}:`, parseError);
          setError(msg);
          return;
        }

        // ===== VALIDATE SUMMARY =====
        const summary = data?.summary?.trim();
        if (!summary) {
          const msg = "API returned empty summary";
          console.error(`[Summarize] ${msg}`);
          setError(msg);
          return;
        }

        // ===== UPDATE STATE =====
        console.log(`[Summarize] Successfully got summary, updating state...`);
        console.log(`[Summarize] Summary preview:`, summary.substring(0, 50) + "...");
        setSummaries((prev: any) => ({ ...prev, [id]: summary }));
        setError("✓ Summary generated!");

        // Clear success message after 2 seconds
        setTimeout(() => setError(null), 2000);

      } catch (err: any) {
        // ===== CATCH ALL ERRORS =====
        const errorMsg = err?.message || "Unknown error occurred";
        console.error(`[Summarize] Caught exception:`, {
          message: errorMsg,
          name: err?.name,
          stack: err?.stack,
        });
        setError(`Summarization error: ${errorMsg}`);
      } finally {
        // ===== CLEANUP =====
        console.log(`[Summarize] Finished for note ${id}`);
        setSummarizingId(null);
      }
    },
    []
  );

  return summarizeNote;
}
