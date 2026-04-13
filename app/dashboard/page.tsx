"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, signOut, getCurrentUser } from "@/lib/supabase";
import NoteCard from "@/app/components/NoteCard";
import NoteModal from "@/app/components/NoteModal";

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
  
  // New iOS feature states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [archivedNotes, setArchivedNotes] = useState<Set<string>>(new Set());

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
      
      // Trim and validate content
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        throw new Error("Cannot summarize empty note");
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmedContent }),
      });

      // Handle different error scenarios
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }

      if (response.status === 503) {
        throw new Error("AI service is temporarily unavailable. Please try again later.");
      }

      if (!response.ok) {
        let errorMessage = "Failed to summarize note";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const { summary } = await response.json();
      
      if (!summary) {
        throw new Error("AI generated empty summary. Please try again.");
      }

      setSummaries((prev) => ({ ...prev, [id]: summary }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to summarize note";
      setError(`Summarization error: ${errorMessage}`);
      console.error("Summarize error:", err);
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

  // iOS Feature Handlers
  const handleOpenNote = (noteToOpen: Note) => {
    setSelectedNote(noteToOpen);
    setShowModal(true);
    setLongPressId(null);
  };

  const handleArchiveNote = (id: string) => {
    setArchivedNotes((prev) => new Set([...prev, id]));
    setError(`Note archived. Swipe to undo.`);
    setTimeout(() => {
      setArchivedNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 3000);
  };

  const handleShareNote = (id: string) => {
    const noteContent = notes.find((n) => n.id === id)?.content || "";
    try {
      navigator.clipboard.writeText(noteContent);
      setError("✓ Note copied to clipboard!");
      setTimeout(() => setError(null), 2000);
    } catch (err) {
      setError("Failed to copy note");
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
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-8">
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
              <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
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
            <p className="text-lg font-semibold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent break-all">
              {user?.email}
            </p>
          </motion.div>
        </motion.div>

        {/* Input Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000" />
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
                  className="w-full sm:w-auto px-6 py-2 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
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
                  <div className="px-6 py-3 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium cursor-help">
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
                  {notes
                    .filter((n) => !archivedNotes.has(n.id))
                    .map((n) => (
                      <NoteCard
                        key={n.id}
                        id={n.id}
                        content={n.content}
                        created_at={n.created_at}
                        summary={summaries[n.id]}
                        isSummarizing={summarizingId === n.id}
                        isDeleting={deletingId === n.id}
                        onCardClick={() => handleOpenNote(n)}
                        onLongPress={() => setLongPressId(n.id)}
                        onDelete={() => deleteNote(n.id)}
                        onArchive={() => handleArchiveNote(n.id)}
                        onShare={() => handleShareNote(n.id)}
                        onSummarize={() => summarizeNote(n.id, n.content)}
                      />
                    ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.main>

      {/* Full Note Modal */}
      <NoteModal
        isOpen={showModal}
        note={selectedNote}
        summary={selectedNote ? summaries[selectedNote.id] : undefined}
        onClose={() => {
          setShowModal(false);
          setSelectedNote(null);
        }}
        onSummarize={selectedNote ? () => summarizeNote(selectedNote.id, selectedNote.content) : undefined}
        isSummarizing={selectedNote ? summarizingId === selectedNote.id : false}
      />
    </div>
  );
}
