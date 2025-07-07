import React from 'react';
import { Heart, Code, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function SettingsFooter() {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="mt-12 text-center py-8 border-t border-slate-200/50 dark:border-slate-700/50"
    >
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Built with</span>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Heart className="h-4 w-4 text-red-500" />
        </motion.div>
        <span>using</span>
        <div className="flex items-center gap-1">
          <Code className="h-4 w-4 text-blue-500" />
          <span className="font-medium">React</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">Framer Motion</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
        Bob Explorer V3 - Modern WhatsApp CRM
      </p>
    </motion.footer>
  );
}