"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getCurrentUser } from "@/lib/supabase";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white text-5xl"
        >
          📝
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, -10, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
      />

      <motion.main
        className="text-center max-w-2xl z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-6"
          >
            📝
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">
            Notes App
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            Keep your thoughts organized and secure. Your notes, encrypted and synchronized across all your devices.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000" />
            <Link
              href="/login"
              className="relative block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-1000" />
            <Link
              href="/signup"
              className="relative block backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
            >
              Create Account
            </Link>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="font-semibold mb-2">Secure</h3>
            <p className="text-gray-400 text-sm">End-to-end encrypted with Supabase</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Fast</h3>
            <p className="text-gray-400 text-sm">Instant sync and real-time updates</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold mb-2">Beautiful</h3>
            <p className="text-gray-400 text-sm">Modern UI with smooth animations</p>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
