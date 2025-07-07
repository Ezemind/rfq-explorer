import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function LoadingSpinner({ className, size = "default" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    default: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4"
  };

  return (
    <motion.div
      className={cn(
        "rounded-full border-slate-200 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

export function LoadingDots({ className }) {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -10 }
  };

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-blue-500 rounded-full"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ className, children }) {
  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}