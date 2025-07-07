import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Database, Server } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export function SystemStatus({ className }) {
  const [status, setStatus] = useState({
    database: 'online',
    server: 'online',
    connectivity: 'online'
  });

  // Simulate status checks (in real app, this would be actual health checks)
  useEffect(() => {
    const checkStatus = () => {
      // In real implementation, check actual system health
      setStatus({
        database: Math.random() > 0.1 ? 'online' : 'offline',
        server: Math.random() > 0.05 ? 'online' : 'offline', 
        connectivity: navigator.onLine ? 'online' : 'offline'
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    
    // Listen for online/offline events
    window.addEventListener('online', checkStatus);
    window.addEventListener('offline', checkStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkStatus);
      window.removeEventListener('offline', checkStatus);
    };
  }, []);

  const getStatusColor = (systemStatus) => {
    switch (systemStatus) {
      case 'online': return 'success';
      case 'offline': return 'destructive';
      case 'warning': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (system, systemStatus) => {
    const iconClasses = "h-3 w-3 mr-1";
    
    switch (system) {
      case 'database':
        return <Database className={iconClasses} />;
      case 'server':
        return <Server className={iconClasses} />;
      case 'connectivity':
        return systemStatus === 'online' ? 
          <Wifi className={iconClasses} /> : 
          <WifiOff className={iconClasses} />;
      default:
        return null;
    }
  };

  const allOnline = Object.values(status).every(s => s === 'online');

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        animate={{ 
          scale: allOnline ? [1, 1.02, 1] : 1
        }}
        transition={{ 
          duration: 2, 
          repeat: allOnline ? Infinity : 0,
          ease: "easeInOut" 
        }}
      >
        <Badge 
          variant={allOnline ? "success" : "destructive"}
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
        >
          <motion.div
            className="w-2 h-2 bg-current rounded-full mr-2"
            animate={{ 
              opacity: allOnline ? [1, 0.5, 1] : 1
            }}
            transition={{ 
              duration: 1.5, 
              repeat: allOnline ? Infinity : 0 
            }}
          />
          {allOnline ? 'All Systems Online' : 'System Issues Detected'}
        </Badge>
      </motion.div>
      
      <div className="hidden lg:flex items-center gap-1">
        {Object.entries(status).map(([system, systemStatus]) => (
          <Badge
            key={system}
            variant="outline"
            className={cn(
              "text-xs capitalize",
              systemStatus === 'online' && "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
              systemStatus === 'offline' && "border-red-200 text-red-700 dark:border-red-800 dark:text-red-400"
            )}
          >
            {getStatusIcon(system, systemStatus)}
            {system}
          </Badge>
        ))}
      </div>
    </div>
  );
}