"use client";

import { useState } from "react";
import NoteModal from "./NoteModal";
import NoteMenu from "./NoteMenu";

interface NoteCardProps {
  id: string;
  content: string;
  createdAt: string;
  onDelete: (id: string) => void;
  onSummarize?: (id: string) => void;
  className?: string;
}

export default function NoteCard({
  id,
  content,
  createdAt,
  onDelete,
  onSummarize,
  className = "",
}: NoteCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (isSummarizing || !content.trim()) return;
    
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, noteId: id }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data.summary || "No summary available");
    } catch (error) {
      console.error("Error summarizing:", error);
      setSummary("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }

    onSummarize?.(id);
  };

  const truncatedContent = content.length > 150 ? content.substring(0, 150) + "..." : content;
  const formattedDate = new Date(createdAt).toLocaleString();

  return (
    <>
      <div
        className={`
          relative p-4 rounded-xl bg-white border border-gray-200 
          shadow-sm hover:shadow-lg transition-all duration-300
          group cursor-pointer h-full flex flex-col
          ${className}
        `}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Date */}
        <p className="text-xs text-gray-500 mb-2">{formattedDate}</p>

        {/* Content Preview */}
        <p className="text-sm text-gray-700 leading-relaxed grow wrap-break-word font-light">
          {truncatedContent}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSummarize();
            }}
            disabled={isSummarizing}
            className="text-xs px-3 py-1 rounded-full bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium transition-all"
          >
            {isSummarizing ? "✨ Generating..." : "✨ Summarize"}
          </button>

          <NoteMenu
            onDelete={() => onDelete(id)}
            onArchive={() => console.log("Archive: " + id)}
            onShare={() => console.log("Share: " + id)}
          />
        </div>

        {/* Summary Display */}
        {summary && (
          <div className="mt-4 p-3 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200/60">
            <p className="text-xs font-semibold text-blue-900 mb-1">Summary:</p>
            <p className="text-xs text-blue-800 leading-relaxed">{summary}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        note={{ id, content, created_at: createdAt }}
        summary={summary || undefined}
        onSummarize={() => handleSummarize()}
      />
    </>
  );
}
