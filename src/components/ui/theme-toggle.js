import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

export function ThemeToggle({ theme, toggleTheme, className }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative overflow-hidden transition-all duration-500 hover:bg-slate-100 dark:hover:bg-slate-800",
        className
      )}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        className="relative flex items-center justify-center w-5 h-5"
        animate={{ rotate: theme === 'light' ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <Sun 
          className={cn(
            "h-5 w-5 transition-all duration-300 absolute top-0 left-0",
            theme === 'light' 
              ? "rotate-0 scale-100 text-amber-500" 
              : "rotate-90 scale-0 text-amber-500"
          )} 
        />
        <Moon 
          className={cn(
            "h-5 w-5 transition-all duration-300 absolute top-0 left-0",
            theme === 'dark' 
              ? "rotate-0 scale-100 text-blue-400" 
              : "-rotate-90 scale-0 text-blue-400"
          )} 
        />
      </motion.div>
    </Button>
  );
}