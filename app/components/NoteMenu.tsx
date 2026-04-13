"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NoteMenuProps {
  onDelete: () => void;
  onArchive: () => void;
  onShare: () => void;
  isDeleting?: boolean;
}

export default function NoteMenu({
  onDelete,
  onArchive,
  onShare,
  isDeleting,
}: NoteMenuProps) {
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
      icon: "👁️",
      label: "Archive",
      action: () => {
        onArchive();
        setIsOpen(false);
      },
      color: "hover:bg-amber-50 hover:text-amber-700",
    },
    {
      icon: "📋",
      label: "Share",
      action: () => {
        onShare();
        setIsOpen(false);
      },
      color: "hover:bg-blue-50 hover:text-blue-700",
    },
    {
      icon: "🗑️",
      label: "Delete",
      action: () => {
        onDelete();
        setIsOpen(false);
      },
      color: "hover:bg-red-50 hover:text-red-700",
      isDangerous: true,
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* Menu Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-lg hover:bg-gray-100/50 transition-all"
      >
        <span className="text-lg">⋯</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-lg border border-gray-200/60 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="py-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={index}
                  onClick={item.action}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-all ${
                    item.color
                  } ${isDeleting && item.isDangerous ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
