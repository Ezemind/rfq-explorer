import React, { useState, useRef, useEffect } from 'react';

export function ScrollableContainer({ children, className = "" }) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollable = () => {
      const hasScroll = container.scrollHeight > container.clientHeight;
      setShowScrollIndicator(hasScroll);
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [children]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        className="overflow-y-auto h-full"
      >
        {children}
      </div>
      
      {/* Scroll indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
}