"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLongPress } from "@/app/hooks/useLongPress";
import NoteMenu from "@/app/components/NoteMenu";

interface NoteCardProps {
  id: string;
  content: string;
  created_at: string;
  summary?: string;
  isSummarizing?: boolean;
  isDeleting?: boolean;
  onCardClick: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onShare: () => void;
  onSummarize: () => void;
}

export default function NoteCard({
  id,
  content,
  created_at,
  summary,
  isSummarizing,
  isDeleting,
  onCardClick,
  onLongPress,
  onDelete,
  onArchive,
  onShare,
  onSummarize,
}: NoteCardProps) {
  const [isHoldingPress, setIsHoldingPress] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => {
      setIsHoldingPress(true);
      onLongPress();
    },
    onRelease: () => {
      setIsHoldingPress(false);
    },
    duration: 400,
  });

  const shortPreview = content.substring(0, 150);
  const hasMore = content.length > 150;
  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -100 }}
      transition={{ duration: 0.3 }}
      className="group relative h-full flex flex-col"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

      {/* Card Container */}
      <motion.div
        whileHover={{ translateY: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={onCardClick}
        {...longPressHandlers}
        className="relative backdrop-blur-3xl bg-gradient-to-br from-white/20 to-white/5 border border-white/30 hover:border-white/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer group/card select-none"
      >
        {/* Header with Menu */}
        <div className="flex items-start justify-between px-6 py-5 sm:py-6">
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest opacity-70 mb-1">
              Note
            </p>
            <time className="text-xs sm:text-sm text-gray-500 font-medium">
              {formattedDate}
            </time>
          </div>

          {/* Menu Button - Visible on Hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="opacity-0 group-hover/card:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <NoteMenu
              onDelete={onDelete}
              onArchive={onArchive}
              onShare={onShare}
              isDeleting={isDeleting}
            />
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-5">
          {/* Show Summary if Long Pressing */}
          {isHoldingPress && summary ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 space-y-3"
            >
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                ✨ Summary Preview
              </p>
              <p className="text-sm text-gray-300 leading-relaxed break-words font-light">
                {summary}
              </p>
            </motion.div>
          ) : (
            /* Show Note Content */
            <div className="flex-1 flex flex-col">
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed break-words font-light line-clamp-5">
                {shortPreview}
              </p>
              {hasMore && (
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  Read more...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Footer Buttons */}
        <div className="px-6 py-4 sm:py-5 space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-2">
            {/* Summarize Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSummarize();
              }}
              disabled={isSummarizing}
              whileHover={!isSummarizing ? { scale: 1.05, y: -2 } : {}}
              whileTap={!isSummarizing ? { scale: 0.95 } : {}}
              className={`flex-1 relative px-4 py-2.5 rounded-xl font-semibold text-sm transition-all overflow-hidden group/btn ${
                isSummarizing
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md hover:shadow-lg"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 pointer-events-none" />

              {isSummarizing ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    ⚡
                  </motion.span>
                  <span className="hidden sm:inline text-xs">AI...</span>
                </span>
              ) : (
                <span className="text-sm">✨ Summarize</span>
              )}
            </motion.button>

            {/* View Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onCardClick();
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              👁️ View
            </motion.button>
          </div>

          {/* Long Press Hint (Mobile) */}
          <p className="text-xs text-gray-500 text-center sm:hidden">
            Hold to preview summary
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
