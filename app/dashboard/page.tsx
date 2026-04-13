"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, signOut, getCurrentUser } from "@/lib/supabase";

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<{ [key: string]: string }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { user: currentUser } = await getCurrentUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      fetchNotes();
    };

    checkAuth();
  }, [router]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        setError("Failed to fetch notes");
        return;
      }

      setNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching notes");
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        setError("Not authenticated");
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from("notes").insert({
        content: note.trim(),
        user_id: userId,
      });

      if (insertError) {
        setError(insertError.message || "Failed to add note");
        setIsSubmitting(false);
        return;
      }

      setNote("");
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      setDeletingId(id);
      setError(null);

      const { error: deleteError } = await supabase
        .from("notes")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message || "Failed to delete note");
        setDeletingId(null);
        return;
      }

      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  const summarizeNote = async (id: string, content: string) => {
    try {
      setSummarizingId(id);
      setError(null);
      
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to summarize");
      }

      const { summary } = await response.json();
      setSummaries((prev) => ({ ...prev, [id]: summary }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize note");
    } finally {
      setSummarizingId(null);
    }
  };

  const copySummaryToClipboard = async (summary: string) => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedId("copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-lg font-semibold"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, -10, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
      </div>

      <motion.main
        className="max-w-3xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                My Notes
              </h1>
              <p className="text-gray-400">Keep your thoughts organized</p>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 transition-all duration-300 font-medium"
            >
              Logout
            </motion.button>
          </div>

          {/* User Info Card */}
          <motion.div
            whileHover={{ translateY: -2 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl"
          >
            <p className="text-sm text-gray-400 mb-1">Logged in as</p>
            <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent break-all">
              {user?.email}
            </p>
          </motion.div>
        </motion.div>

        {/* Input Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000" />
            <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Add a new note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    addNote();
                  }
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 resize-none text-sm sm:text-base"
                placeholder="What's on your mind? (Ctrl/Cmd+Enter)"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                <p className="text-xs text-gray-500">
                  {note.length} characters
                </p>
                <motion.button
                  onClick={addNote}
                  disabled={isSubmitting || !note.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ⚡
                      </motion.span>
                      Adding...
                    </span>
                  ) : (
                    "Add Note"
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-6 p-4 backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <motion.div
            variants={itemVariants}
            className="text-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block text-4xl mb-4"
            >
              ✨
            </motion.div>
            <p className="text-gray-400">Loading your notes...</p>
          </motion.div>
        )}

        {/* Notes Grid */}
        {!loading && (
          <motion.div variants={itemVariants}>
            {notes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 sm:py-24"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-7xl sm:text-8xl mb-4"
                >
                  📝
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  No notes yet
                </h3>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  Create your first note and let AI help you summarize it
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="inline-block"
                >
                  <div className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium cursor-help">
                    👆 Add a note above to get started
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {notes.map((n, index) => (
                    <motion.div
                      key={n.id}
                      variants={itemVariants}
                      exit={{ opacity: 0, scale: 0.8, x: -100 }}
                      layout
                      className="group relative h-full flex flex-col"
                    >
                      {/* Glow Background - Animated on hover */}
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600/40 via-pink-600/20 to-blue-600/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                      {/* Card Container */}
                      <motion.div
                        whileHover={{ translateY: -6, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative backdrop-blur-2xl bg-gradient-to-br from-white/12 to-white/5 border border-white/20 hover:border-white/40 rounded-2xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.3)] transition-all duration-500 h-full flex flex-col overflow-hidden group/card"
                      >
                        {/* Card Header - Metadata */}
                        <div className="px-5 sm:px-6 pt-5 sm:pt-6 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-purple-300 uppercase tracking-widest opacity-70 mb-1">
                              Note
                            </p>
                            <time className="text-xs sm:text-sm text-gray-400 font-medium">
                              {new Date(n.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })} • {new Date(n.created_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </div>
                          {/* Badge for summarized notes */}
                          {summaries[n.id] && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="px-2.5 py-1 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50 rounded-full"
                            >
                              <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                                ✨ Summarized
                              </span>
                            </motion.div>
                          )}
                        </div>

                        {/* Content Section - Flexible with gradient fade */}
                        <div className="flex-1 overflow-hidden flex flex-col px-5 sm:px-6 py-4 sm:py-5">
                          {/* Main Content with Gradient Fade */}
                          <div className="flex-1 overflow-y-auto relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5 pointer-events-none rounded-lg" />
                            <p className="text-white text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap font-light tracking-wide pr-2 relative z-10">
                              {n.content.length > 300 ? (
                                <>
                                  {n.content.substring(0, 300)}
                                  <span className="text-gray-500">...</span>
                                </>
                              ) : (
                                n.content
                              )}
                            </p>
                          </div>

                          {/* Summary Section - Premium Display */}
                          {summaries[n.id] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ type: "spring", stiffness: 250, damping: 30 }}
                              className="mt-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-blue-500/15 border border-blue-400/40 backdrop-blur-sm shadow-lg"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2.5">
                                <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                                  ✨ Summary
                                </p>
                                <motion.button
                                  onClick={() => copySummaryToClipboard(summaries[n.id])}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="px-2.5 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-500/40 to-cyan-500/40 hover:from-blue-500/60 hover:to-cyan-500/60 text-blue-200 hover:text-blue-100 transition-all shadow-lg hover:shadow-[0_8px_16px_-4px_rgba(34,197,94,0.3)] border border-blue-400/40 font-medium flex-shrink-0 whitespace-nowrap"
                                >
                                  {copiedId === n.id ? "✓ Copied!" : "📋 Copy"}
                                </motion.button>
                              </div>
                              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed break-words font-light">
                                {summaries[n.id]}
                              </p>
                            </motion.div>
                          )}
                        </div>

                        {/* Divider - Premium Style */}
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        {/* Footer Section - Premium Buttons */}
                        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-3">
                          {/* Button Grid - Responsive */}
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                            {/* Summarize Button - Premium Gradient */}
                            <motion.button
                              onClick={() => summarizeNote(n.id, n.content)}
                              disabled={summarizingId === n.id}
                              whileHover={summarizingId !== n.id ? { scale: 1.05, y: -2 } : {}}
                              whileTap={summarizingId !== n.id ? { scale: 0.95 } : {}}
                              className={`flex-1 relative group/btn px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden ${
                                summarizingId === n.id
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                                  : "bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.4)]"
                              }`}
                            >
                              {/* Shimmer effect on hover */}
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 pointer-events-none" />
                              
                              {summarizingId === n.id ? (
                                <span className="flex items-center justify-center gap-2.5 relative z-10">
                                  <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="text-base"
                                  >
                                    ⚡
                                  </motion.span>
                                  <span className="hidden sm:inline">Analyzing...</span>
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                  <span>✨</span>
                                  <span>Summarize</span>
                                </span>
                              )}
                            </motion.button>

                            {/* Delete Button - Premium Red */}
                            <motion.button
                              onClick={() => deleteNote(n.id)}
                              disabled={deletingId === n.id}
                              whileHover={deletingId !== n.id ? { scale: 1.05, y: -2 } : {}}
                              whileTap={deletingId !== n.id ? { scale: 0.95 } : {}}
                              className={`flex-1 relative group/btn px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden ${
                                deletingId === n.id
                                  ? "bg-red-600/80 text-white border border-red-500/50 shadow-lg"
                                  : "bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/50 hover:to-red-600/50 border border-red-500/60 hover:border-red-400/80 text-red-300 hover:text-red-200 shadow-md hover:shadow-[0_12px_24px_-8px_rgba(239,68,68,0.3)]"
                              }`}
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 pointer-events-none" />
                              
                              <span className="flex items-center justify-center gap-2 relative z-10">
                                <span>🗑️</span>
                                <span>{deletingId === n.id ? "Deleting..." : "Delete"}</span>
                              </span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
