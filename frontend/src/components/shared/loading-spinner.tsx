"use client";

import { motion } from 'framer-motion';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="h-12 w-12 rounded-full border-t-2 border-r-2 border-blue-500 border-opacity-50 border-solid"
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-zinc-400 font-medium"
      >
        {message}
      </motion.p>
    </div>
  );
}
