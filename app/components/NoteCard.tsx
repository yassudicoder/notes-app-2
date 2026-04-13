"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import NoteModal from "./NoteModal";
import NoteMenu from "./NoteMenu";

interface NoteCardProps {
  id: string;
  content: string;
  created_at: string;
  summary?: string;
  isSummarizing?: boolean;
  isDeleting?: boolean;
  onCardClick?: () => void;
  onLongPress?: () => void;
  onDelete: () => Promise<void> | void;
  onArchive?: () => void;
  onShare?: () => void;
  onSummarize?: () => Promise<void> | void;
  className?: string;
}

export default function NoteCard({
  id,
  content,
  created_at,
  summary,
  isSummarizing = false,
  isDeleting = false,
  onCardClick,
  onLongPress,
  onDelete,
  onArchive,
  onShare,
  onSummarize,
  className = "",
}: NoteCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressingRef = useRef(false);

  const handleMouseDown = () => {
    isLongPressingRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressingRef.current = true;
      onLongPress?.();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const truncatedContent = content.length > 150 ? content.substring(0, 150) + "..." : content;
  const formattedDate = new Date(created_at).toLocaleString();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`
          relative p-5 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 
          shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105
          group cursor-pointer h-full flex flex-col
          ${isDeleting ? "opacity-50 pointer-events-none" : ""}
          ${className}
        `}
        onClick={() => {
          onCardClick?.();
          setIsModalOpen(true);
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {/* Date Badge */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 font-medium">{formattedDate}</p>
          {isSummarizing && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">✨ Generating...</span>}
        </div>

        {/* Content Preview */}
        <p className="text-sm text-gray-700 leading-relaxed grow wrap-break-word font-light flex-1">
          {truncatedContent}
        </p>

        {/* Summary Display */}
        {summary && (
          <div className="mt-3 p-3 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200/40">
            <p className="text-xs font-semibold text-blue-900 mb-1">✨ Summary:</p>
            <p className="text-xs text-blue-800 leading-relaxed line-clamp-2">{summary}</p>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSummarize?.();
            }}
            disabled={isSummarizing || isDeleting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs px-3 py-1.5 rounded-full bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium transition-all shadow-sm"
          >
            {isSummarizing ? "✨ Generating..." : "✨ Summarize"}
          </motion.button>

          <NoteMenu
            onDelete={async () => {
              await onDelete();
            }}
            onArchive={onArchive || (() => {})}
            onShare={onShare || (() => {})}
            isDeleting={isDeleting}
          />
        </div>
      </motion.div>

      {/* Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        note={{ id, content, created_at }}
        summary={summary}
        isSummarizing={isSummarizing}
        onSummarize={onSummarize}
      />
    </>
  );
}
