"use client";
import { useState, useMemo } from "react";

interface MemoriesProps {
  allNotes: Array<{ id: string; content: string; created_at: string }>;
  onNoteClick: (note: any) => void;
}

/**
 * "Memories" feature - Shows notes from same date in past years
 * Like Snapchat/Google Photos memories
 */
export default function Memories({ allNotes, onNoteClick }: MemoriesProps) {
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  const memories = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const memoList: Array<{
      year: number;
      yearsAgo: number;
      notes: any[];
    }> = [];

    allNotes.forEach((note) => {
      const noteDate = new Date(note.created_at);
      const noteMonth = noteDate.getMonth();
      const noteDay = noteDate.getDate();
      const noteYear = noteDate.getFullYear();

      // Find notes with same month/day (anniversary)
      if (noteMonth === todayMonth && noteDay === todayDate) {
        const yearsAgo = today.getFullYear() - noteYear;
        
        if (yearsAgo > 0) {
          const existing = memoList.find((m) => m.year === noteYear);
          if (existing) {
            existing.notes.push(note);
          } else {
            memoList.push({
              year: noteYear,
              yearsAgo,
              notes: [note],
            });
          }
        }
      }
    });

    return memoList.sort((a, b) => b.yearsAgo - a.yearsAgo);
  }, [allNotes]);

  if (memories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">📸 Memories</h2>
      
      <div className="space-y-3">
        {memories.map((memory) => (
          <button
            key={`${memory.year}-${memory.yearsAgo}`}
            onClick={() =>
              setSelectedMemory(
                selectedMemory ===
                  `${memory.year}-${memory.yearsAgo}`
                  ? null
                  : `${memory.year}-${memory.yearsAgo}`
              )
            }
            className="w-full text-left bg-amber-50 border border-amber-200 rounded-lg p-4 hover:shadow-md transition-all"
          >
            {/* Memory Header */}
            <p className="font-semibold text-amber-900 mb-1">
              {memory.yearsAgo === 1
                ? "1 year ago"
                : `${memory.yearsAgo} years ago`}
            </p>
            <p className="text-sm text-amber-700">
              {memory.notes.length} note{memory.notes.length !== 1 ? "s" : ""} on
              this day
            </p>

            {/* Expanded Memory */}
            {selectedMemory === `${memory.year}-${memory.yearsAgo}` && (
              <div className="mt-4 space-y-3 pt-4 border-t border-amber-200">
                {memory.notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNoteClick(note);
                    }}
                    className="w-full text-left bg-white p-3 rounded border border-amber-100 hover:bg-amber-50 transition-colors"
                  >
                    <p className="text-xs text-amber-600 font-medium mb-1">
                      {new Date(note.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {note.content.substring(0, 120)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
