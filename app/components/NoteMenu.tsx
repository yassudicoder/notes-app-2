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
    <div ref={menuRef} className="relative inline-block">
      {/* Menu Button - Touch-friendly size */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="p-2.5 sm:p-2 rounded-lg hover:bg-white/20 active:bg-white/30 transition-all duration-200 cursor-pointer"
        title="More options"
      >
        <span className="text-lg sm:text-base leading-none">⋯</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -8 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute right-0 top-full mt-1.5 w-44 sm:w-48 bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-1.5">
              {menuItems.map((item, index) => (
                <motion.button
                  key={index}
                  onClick={item.action}
                  disabled={isDeleting && item.isDangerous}
                  whileHover={!isDeleting || !item.isDangerous ? { scale: 1.02, x: 3 } : {}}
                  whileTap={!isDeleting || !item.isDangerous ? { scale: 0.98 } : {}}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm font-medium flex items-center gap-2.5 transition-all ${
                    item.color
                  } ${(isDeleting && item.isDangerous) ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
