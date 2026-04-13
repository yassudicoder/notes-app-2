"use client";
import { motion, AnimatePresence } from "framer-motion";

interface NoteModalProps {
  isOpen: boolean;
  note: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  summary?: string;
  onClose: () => void;
  onSummarize?: (noteId: string) => void;
  isSummarizing?: boolean;
}

export default function NoteModal({
  isOpen,
  note,
  summary,
  onClose,
  onSummarize,
  isSummarizing,
}: NoteModalProps) {
  if (!note) return null;

  const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    📝 Full Note
                  </p>
                  <time className="text-sm text-gray-600 font-medium">
                    {formattedDate}
                  </time>
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors"
                >
                  <span className="text-xl">✕</span>
                </motion.button>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Main Content */}
                <div className="space-y-4">
                  <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap break-words font-light tracking-wide">
                    {note.content}
                  </p>
                </div>

                {/* Summary Section */}
                {summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/60 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <p className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                        AI Summary
                      </p>
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed font-light">
                      {summary}
                    </p>
                  </motion.div>
                )}

                {/* Summarize Button */}
                {!summary && onSummarize && (
                  <motion.button
                    onClick={() => onSummarize(note.id)}
                    disabled={isSummarizing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    {isSummarizing ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          ⚡
                        </motion.span>
                        Generating Summary...
                      </span>
                    ) : (
                      <span>✨ Generate AI Summary</span>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/20 bg-gradient-to-r from-gray-50/50 to-gray-100/50 px-6 py-4 flex gap-3">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
