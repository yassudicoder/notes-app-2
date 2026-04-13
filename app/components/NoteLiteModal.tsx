"use client";
import { useState } from "react";

interface NoteLiteModalProps {
  isOpen: boolean;
  note: { id: string; content: string; created_at: string } | null;
  summary?: string;
  onClose: () => void;
  onSummarize?: (noteId: string) => void;
  isSummarizing?: boolean;
}

/**
 * Lightweight modal - no heavy animations, focuses on readability
 */
export default function NoteLiteModal({
  isOpen,
  note,
  summary,
  onClose,
  onSummarize,
  isSummarizing,
}: NoteLiteModalProps) {
  if (!isOpen || !note) return null;

  const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
      />

      {/* Modal */}
      <div className="fixed inset-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden md:inset-0 md:top-auto md:left-auto md:translate-x-0 md:translate-y-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <time className="text-sm text-gray-600">{formattedDate}</time>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>

          {/* Summary Section */}
          {summary && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-blue-600 mb-3">
                ✨ Summary
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {/* Generate Summary Button */}
          {!summary && onSummarize && (
            <button
              onClick={() => onSummarize(note.id)}
              disabled={isSummarizing}
              className="mt-6 w-full px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded hover:bg-blue-100 disabled:opacity-50 transition-colors text-sm"
            >
              {isSummarizing ? "⚡ Generating..." : "✨ Generate AI Summary"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
