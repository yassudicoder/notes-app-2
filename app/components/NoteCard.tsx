"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoteModal from "./NoteModal";
import NoteMenu from "./NoteMenu";

interface NoteCardProps {
  id: string;
  content: string;
  created_at: string;
  summary?: string;
  isSummarizing?: boolean;
  isDeleting?: boolean;
  showingSummary?: boolean;
  onCardClick?: () => void;
  onLongPress?: () => void;
  onDelete: () => Promise<void> | void;
  onArchive?: () => void;
  onShare?: () => void;
  onSummarize?: () => Promise<void> | void;
  onToggleSummary?: (id: string, show: boolean) => void;
  className?: string;
}

export default function NoteCard({
  id,
  content,
  created_at,
  summary,
  isSummarizing = false,
  isDeleting = false,
  showingSummary = false,
  onCardClick,
  onLongPress,
  onDelete,
  onArchive,
  onShare,
  onSummarize,
  onToggleSummary,
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

  // Determine what to show in the card body
  const isShowingSummary = showingSummary && summary;
  const displayText = isShowingSummary ? summary : truncatedContent;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`
          relative p-5 rounded-2xl bg-white border border-gray-200 
          shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102
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
        {/* Header: Date + Status */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500">{formattedDate}</p>
          <AnimatePresence>
            {isSummarizing && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium"
              >
                ✨ Generating...
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Content Area - Smooth transitions between note/summary */}
        <div className="flex-1 mb-4 min-h-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={isShowingSummary ? "summary" : "content"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <p
                className={`text-sm leading-relaxed wrap-break-word font-light line-clamp-5 ${
                  isShowingSummary
                    ? "text-blue-900 bg-blue-50/40 p-3 rounded-lg border border-blue-100/50"
                    : "text-gray-700"
                }`}
              >
                {displayText}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {/* Summarize / Toggle Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              if (summary && !isSummarizing) {
                onToggleSummary?.(id, !showingSummary);
              } else if (!summary) {
                onSummarize?.();
              }
            }}
            disabled={isSummarizing || isDeleting}
            whileHover={!isSummarizing && !isDeleting ? { scale: 1.05 } : {}}
            whileTap={!isSummarizing && !isDeleting ? { scale: 0.95 } : {}}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isShowingSummary
                ? "bg-amber-100 hover:bg-amber-200 text-amber-900"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed flex-1`}
          >
            {isSummarizing ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ✨
                </motion.span>
                Generating
              </span>
            ) : isShowingSummary ? (
              "📄 Show Original"
            ) : summary ? (
              "✨ Show Summary"
            ) : (
              "✨ Summarize"
            )}
          </motion.button>

          {/* Menu */}
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
