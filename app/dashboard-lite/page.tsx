"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, signOut, getCurrentUser } from "@/lib/supabase";
import NoteCardLite from "@/app/components/NoteCardLite";
import NoteLiteModal from "@/app/components/NoteLiteModal";
import Memories from "@/app/components/Memories";
import ReminderModal from "@/app/components/ReminderModal";
import GeneratorModal from "@/app/components/GeneratorModal";

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

/**
 * OPTIMIZED LIGHTWEIGHT DASHBOARD
 * - Removed animated background blobs (blur-3xl animations = HUGE performance drain)
 * - Removed stagger animations
 * - Minimal re-renders with useCallback
 * - Mobile-first design
 * - NO glassmorphism or heavy blur effects
 * - Simple, flat design for speed
 */
export default function DashboardPageLite() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<{ [key: string]: string }>({});

  // Modal states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [archivedNotes, setArchivedNotes] = useState<Set<string>>(new Set());

  // Reminders & Generators
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNoteId, setReminderNoteId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState<"flowchart" | "timetable" | null>(null);
  const [generatorNoteId, setGeneratorNoteId] = useState<string | null>(null);

  // Auth check
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

  // Fetch notes with useCallback to prevent unnecessary re-renders
  const fetchNotes = useCallback(async () => {
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
        .order("created_at", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const addNote = useCallback(async () => {
    if (!note.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { error: insertError } = await supabase.from("notes").insert({
        content: note.trim(),
        user_id: userId,
      });

      if (insertError) throw insertError;

      setNote("");
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  }, [note, fetchNotes]);

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        setError(null);
        const { error: deleteError } = await supabase
          .from("notes")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;
        await fetchNotes();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete note");
      }
    },
    [fetchNotes]
  );

  const summarizeNote = useCallback(
    async (id: string, content: string) => {
      try {
        setSummarizingId(id);
        setError(null);

        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!response.ok) throw new Error("Failed to summarize");

        const { summary } = await response.json();
        setSummaries((prev) => ({ ...prev, [id]: summary }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to summarize");
      } finally {
        setSummarizingId(null);
      }
    },
    []
  );

  const handleOpenNote = useCallback((noteToOpen: Note) => {
    setSelectedNote(noteToOpen);
    setShowModal(true);
  }, []);

  const handleArchiveNote = useCallback((id: string) => {
    setArchivedNotes((prev) => new Set([...prev, id]));
    setError("Note archived");
    setTimeout(() => {
      setArchivedNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 3000);
  }, []);

  const handleShareNote = useCallback((id: string) => {
    const noteContent = notes.find((n) => n.id === id)?.content || "";
    try {
      navigator.clipboard.writeText(noteContent);
      setError("✓ Note copied");
      setTimeout(() => setError(null), 2000);
    } catch (err) {
      setError("Failed to copy");
    }
  }, [notes]);

  const handleRemindNote = useCallback((id: string) => {
    setReminderNoteId(id);
    setShowReminderModal(true);
  }, []);

  const handleGenerateFlowchart = useCallback((id: string) => {
    setGeneratorNoteId(id);
    setShowGenerator("flowchart");
  }, []);

  const handleGenerateTimetable = useCallback((id: string) => {
    setGeneratorNoteId(id);
    setShowGenerator("timetable");
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 p-4 sm:p-6">
      <main className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Notes</h1>
            <p className="text-sm text-gray-500">{notes.length} notes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            placeholder="What's on your mind? (Ctrl/Cmd+Enter to add)"
            rows={3}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm resize-none"
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">{note.length} characters</p>
            <button
              onClick={addNote}
              disabled={isSubmitting || !note.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Memories Section */}
        {notes.length > 5 && (
          <Memories
            allNotes={notes}
            onNoteClick={(note) => handleOpenNote(note)}
          />
        )}

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notes yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes
              .filter((n) => !archivedNotes.has(n.id))
              .map((noteItem) => (
                <NoteCardLite
                  key={noteItem.id}
                  id={noteItem.id}
                  content={noteItem.content}
                  created_at={noteItem.created_at}
                  summary={summaries[noteItem.id]}
                  isSummarizing={summarizingId === noteItem.id}
                  onCardClick={() => handleOpenNote(noteItem)}
                  onLongPress={() => {}}
                  onDelete={() => deleteNote(noteItem.id)}
                  onArchive={() => handleArchiveNote(noteItem.id)}
                  onShare={() => handleShareNote(noteItem.id)}
                  onSummarize={() =>
                    summarizeNote(noteItem.id, noteItem.content)
                  }
                  onRemind={() => handleRemindNote(noteItem.id)}
                />
              ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <NoteLiteModal
        isOpen={showModal}
        note={selectedNote}
        summary={selectedNote ? summaries[selectedNote.id] : undefined}
        onClose={() => setShowModal(false)}
        onSummarize={(id) => {
          const noteToSummarize = notes.find((n) => n.id === id);
          if (noteToSummarize)
            summarizeNote(id, noteToSummarize.content);
        }}
        isSummarizing={
          selectedNote ? summarizingId === selectedNote.id : false
        }
      />

      <ReminderModal
        isOpen={showReminderModal}
        noteId={reminderNoteId || ""}
        onClose={() => setShowReminderModal(false)}
        onSave={(id, time) => {
          setError(`✓ Reminder set for ${time}`);
          setShowReminderModal(false);
          setTimeout(() => setError(null), 2000);
        }}
      />

      {showGenerator && generatorNoteId && (
        <GeneratorModal
          isOpen={true}
          content={
            notes.find((n) => n.id === generatorNoteId)?.content || ""
          }
          type={showGenerator}
          onClose={() => {
            setShowGenerator(null);
            setGeneratorNoteId(null);
          }}
          onGenerate={(type) => {
            setError(`✓ ${type} generated!`);
            setShowGenerator(null);
            setGeneratorNoteId(null);
          }}
          isLoading={false}
        />
      )}
    </div>
  );
}
