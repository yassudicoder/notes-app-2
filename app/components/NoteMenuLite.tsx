"use client";
import { useState, useRef, useEffect } from "react";

interface NoteMenuLiteProps {
  onDelete: () => void;
  onArchive: () => void;
  onShare: () => void;
  onRemind?: () => void;
  isDeleting?: boolean;
}

export default function NoteMenuLite({
  onDelete,
  onArchive,
  onShare,
  onRemind,
  isDeleting,
}: NoteMenuLiteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const menuItems = [
    {
      icon: "🕐",
      label: "Remind",
      action: () => {
        onRemind?.();
        setIsOpen(false);
      },
    },
    {
      icon: "📋",
      label: "Share",
      action: () => {
        onShare();
        setIsOpen(false);
      },
    },
    {
      icon: "👁️",
      label: "Archive",
      action: () => {
        onArchive();
        setIsOpen(false);
      },
    },
    {
      icon: "🗑️",
      label: "Delete",
      action: () => {
        onDelete();
        setIsOpen(false);
      },
      isDangerous: true,
    },
  ];

  return (
    <div ref={menuRef} className="relative inline-block">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 active:text-gray-400 transition-colors"
        title="More options"
      >
        <span className="text-lg">⋯</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                disabled={isDeleting && item.isDangerous}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2.5 transition-colors ${
                  item.isDangerous
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-100"
                } ${isDeleting && item.isDangerous ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
