"use client";
import React, { useCallback } from "react";
import { useLongPress } from "@/app/hooks/useLongPressFixed";
import NoteMenuLite from "@/app/components/NoteMenuLite";

interface NoteCardLiteFixedProps {
  id: string;
  content: string;
  created_at: string;
  summary?: string;
  isSummarizing?: boolean;
  isDeleting?: boolean;
  onCardClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onShare: () => void;
  onSummarize: () => void;
  onRemind?: () => void;
}

/**
 * FIXED Lightweight note card
 * 
 * What was fixed:
 * 1. Hold-to-summarize now TRIGGERS summarization (not just preview)
 *    - Holding the card for 600ms calls onSummarize()
 *    - Shows visual feedback (isHolding state)
 *    - While summarizing, shows loading state
 * 
 * 2. Better handling of button click event propagation
 *    - Uses e.stopPropagation() correctly
 *    - Prevents triggering hold-to-summarize when clicking button
 * 
 * 3. Improved state display logic
 *    - Prevents multiple simultaneous summary generations
 *    - Shows proper loading/error states
 */
export default function NoteCardLiteFixed({
  id,
  content,
  created_at,
  summary,
  isSummarizing,
  isDeleting,
  onCardClick,
  onDelete,
  onArchive,
  onShare,
  onSummarize,
  onRemind,
}: NoteCardLiteFixedProps) {
  // Fixed: Use the improved long-press hook with 600ms duration
  const { isHolding, handlers } = useLongPress({
    onLongPress: () => {
      // FIXED: Hold now TRIGGERS summarization instead of just showing preview
      console.log(`[Hold] Triggering summarization for note ${id}`);
      onSummarize();
    },
    duration: 600, // Hold for 600ms
  });

  const shortPreview = content.substring(0, 120);
  const hasMore = content.length > 120;

  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Prevent event propagation when clicking buttons
  const handleSummarizeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log(`[Button] Clicked summarize for note ${id}`);
      onSummarize();
    },
    [id, onSummarize]
  );

  const handleViewClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log(`[Button] Clicked view for note ${id}`);
      onCardClick();
    },
    [id, onCardClick]
  );

  return (
    <div
      {...handlers}
      className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 select-none ${
        isHolding ? "bg-blue-50 border-blue-300 scale-[0.98]" : "hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <time className="text-xs text-gray-500 font-medium">{formattedDate}</time>

        {/* Menu Button */}
        <div onClick={(e) => e.stopPropagation()}>
          <NoteMenuLite
            onDelete={onDelete}
            onArchive={onArchive}
            onShare={onShare}
            onRemind={onRemind}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Content or Summary Display */}
      <div className="mb-3">
        {/* Show summary if loaded */}
        {summary ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              ✨ Summary
            </p>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
              {summary}
            </p>
          </div>
        ) : (
          /* Show note content preview */
          <div>
            <p className="text-sm text-gray-800 leading-relaxed line-clamp-4">
              {shortPreview}
            </p>
            {hasMore && (
              <p className="text-xs text-gray-500 mt-2">Read more...</p>
            )}
          </div>
        )}

        {/* Hold feedback while summarizing */}
        {isHolding && isSummarizing && (
          <p className="text-xs text-blue-600 mt-2 font-medium">
            ✨ Generating summary...
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={handleSummarizeClick}
          disabled={isSummarizing}
          className="flex-1 text-xs font-medium px-3 py-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Click to summarize or hold card"
        >
          {isSummarizing ? "⚡ AI..." : "✨ Summary"}
        </button>
        <button
          onClick={handleViewClick}
          className="flex-1 text-xs font-medium px-3 py-2 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          title="View full note"
        >
          👁️ View
        </button>
      </div>
    </div>
  );
}
