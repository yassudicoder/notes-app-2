"use client";
import { useState } from "react";

interface ReminderModalProps {
  isOpen: boolean;
  noteId: string;
  onClose: () => void;
  onSave: (noteId: string, reminderTime: string) => void;
  isLoading?: boolean;
}

export default function ReminderModal({
  isOpen,
  noteId,
  onClose,
  onSave,
  isLoading,
}: ReminderModalProps) {
  const [reminderTime, setReminderTime] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (reminderTime) {
      onSave(noteId, reminderTime);
      setReminderTime("");
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/30 z-40" />
      <div className="fixed inset-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm bg-white rounded-lg shadow-xl z-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">🕐 Set Reminder</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remind me at
            </label>
            <input
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!reminderTime || isLoading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
