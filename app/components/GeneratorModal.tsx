"use client";
import { useState } from "react";

interface GeneratorModalProps {
  isOpen: boolean;
  content: string;
  type: "flowchart" | "timetable";
  onClose: () => void;
  onGenerate: (type: "flowchart" | "timetable") => void;
  isLoading: boolean;
}

export default function GeneratorModal({
  isOpen,
  content,
  type,
  onClose,
  onGenerate,
  isLoading,
}: GeneratorModalProps) {
  if (!isOpen) return null;

  const title = type === "flowchart" ? "Generate Flowchart" : "Generate Timetable";
  const icon = type === "flowchart" ? "🔀" : "⏰";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/30 z-40" />
      <div className="fixed inset-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md bg-white rounded-lg shadow-xl z-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">
            {icon} {title}
          </p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {type === "flowchart"
            ? "Convert your note into a step-by-step flowchart"
            : "Create a structured schedule from your notes"}
        </p>

        <div className="bg-gray-50 rounded p-3 mb-4 max-h-32 overflow-auto">
          <p className="text-xs text-gray-700 line-clamp-5">{content}</p>
        </div>

        <button
          onClick={() => {
            onGenerate(type);
            onClose();
          }}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          {isLoading ? "⚡ Generating..." : `Generate ${type}`}
        </button>
      </div>
    </>
  );
}
