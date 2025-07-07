import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Clock, Check, CheckCheck, Download } from 'lucide-react';
import { formatSATime } from '../../utils/timeZone';
import { cn } from '../../lib/utils';
import MessageTextRenderer from '../../components/ui/MessageTextRenderer';

function MessageList({ messages, loading, customerPhone }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-slate-100 rounded-full mx-auto mb-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 dark:text-slate-400">Loading messages...</p>
        </motion.div>
      </div>
    );
  }

  // Authentic WhatsApp-style background pattern
  const lightPattern = `
    url("data:image/svg+xml,%3csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='whatsapp-light' x='0' y='0' width='60' height='60' patternUnits='userSpaceOnUse'%3e%3cg fill='%23d1d5db' fill-opacity='0.15'%3e%3cpath d='M25 15c8 0 15 7 15 15s-7 15-15 15-15-7-15-15 7-15 15-15zm0 5c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z'/%3e%3cpath d='M45 5c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5z'/%3e%3cpath d='M8 45c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4z'/%3e%3cpath d='M52 35l6 4-6 4v-8z'/%3e%3c/g%3e%3c/pattern%3e%3c/defs%3e%3crect width='120' height='120' fill='url(%23whatsapp-light)'/%3e%3c/svg%3e"),
    url("data:image/svg+xml,%3csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23e5e7eb' fill-opacity='0.08'%3e%3cpath d='M20 20c15 0 25 10 25 25s-10 25-25 25-25-10-25-25 10-25 25-25zm0 10c-8 0-15 7-15 15s7 15 15 15 15-7 15-15-7-15-15-15z'/%3e%3cpath d='M60 10c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10z'/%3e%3cpath d='M15 60l8 5-8 5v-10z'/%3e%3c/g%3e%3c/svg%3e")
  `;

  const darkPattern = `
    url("data:image/svg+xml,%3csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='whatsapp-dark' x='0' y='0' width='60' height='60' patternUnits='userSpaceOnUse'%3e%3cg fill='%23374151' fill-opacity='0.12'%3e%3cpath d='M25 15c8 0 15 7 15 15s-7 15-15 15-15-7-15-15 7-15 15-15zm0 5c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z'/%3e%3cpath d='M45 5c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5z'/%3e%3cpath d='M8 45c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4z'/%3e%3cpath d='M52 35l6 4-6 4v-8z'/%3e%3c/g%3e%3c/pattern%3e%3c/defs%3e%3crect width='120' height='120' fill='url(%23whatsapp-dark)'/%3e%3c/svg%3e"),
    url("data:image/svg+xml,%3csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%232d3748' fill-opacity='0.06'%3e%3cpath d='M20 20c15 0 25 10 25 25s-10 25-25 25-25-10-25-25 10-25 25-25zm0 10c-8 0-15 7-15 15s7 15 15 15 15-7 15-15-7-15-15-15z'/%3e%3cpath d='M60 10c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10z'/%3e%3cpath d='M15 60l8 5-8 5v-10z'/%3e%3c/g%3e%3c/svg%3e")
  `;

  return (
    <div className="flex-1 overflow-y-auto bg-[#efeae2] dark:bg-[#0b141a]" data-messages-container>
      {/* Authentic WhatsApp-style background */}
      <div 
        className="min-h-full relative"
        style={{
          backgroundImage: lightPattern,
          backgroundSize: '120px 120px, 80px 80px',
          backgroundPosition: '0 0, 40px 40px'
        }}
      >
        {/* Dark mode pattern overlay */}
        <div 
          className="absolute inset-0 dark:opacity-100 opacity-0 transition-opacity duration-300"
          style={{
            backgroundImage: darkPattern,
            backgroundSize: '120px 120px, 80px 80px',
            backgroundPosition: '0 0, 40px 40px'
          }}
        />
        
        {/* WhatsApp-like texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-black/2 dark:from-white/1 dark:via-transparent dark:to-black/5" />
        <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23d4d4d8' fill-opacity='0.03'%3e%3cpath d='M50 30c20 5 35 20 40 40-5 20-20 35-40 40-20-5-35-20-40-40 5-20 20-35 40-40z'/%3e%3cpath d='M150 130c20 5 35 20 40 40-5 20-20 35-40 40-20-5-35-20-40-40 5-20 20-35 40-40z'/%3e%3c/g%3e%3c/svg%3e")`,
          backgroundSize: '400px 400px'
        }} />
        <div className="relative z-10 px-6 py-3 space-y-2 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No messages yet</h3>
              <p className="text-slate-500 dark:text-slate-400">Start the conversation below</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MessageBubble 
                    message={message}
                    isFromCustomer={(message.sender || message.sender_type) === 'customer'}
                    customerPhone={customerPhone}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
function MessageBubble({ message, isFromCustomer, customerPhone }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if ((message.message_type === 'audio' || message.message_type === 'image' || message.message_type === 'photo') && message.media_url) {
      const resolveMediaUrl = async () => {
        try {
          if (!window.electronAPI || !window.electronAPI.getMediaUrl) {
            setMediaUrl(message.media_url);
            setAudioError(false);
            return;
          }
          
          const resolvedUrl = await window.electronAPI.getMediaUrl(message.media_url, customerPhone);
          
          if (resolvedUrl.includes('bob-explorer-webhook-production.up.railway.app') || 
              resolvedUrl.includes('drive.google.com')) {
            const blobResult = await window.electronAPI.fetchAudioBlob(resolvedUrl);
            
            if (blobResult.success) {
              setMediaUrl(blobResult.data);
              setAudioError(false);
            } else {
              setMediaUrl(resolvedUrl);
              setAudioError(true);
            }
          } else {
            setMediaUrl(resolvedUrl);
            setAudioError(false);
          }
          
        } catch (error) {
          console.error('Failed to resolve media URL:', error);
          setMediaUrl(message.media_url);
          setAudioError(true);
        }
      };
      resolveMediaUrl();
    }
  }, [message]);

  useEffect(() => {
    if (audioRef.current && mediaUrl) {
      audioRef.current.load();
    }
  }, [mediaUrl]);

  const formatTime = (timestamp) => {
    const actualTimestamp = timestamp || message.timestamp || message.created_at;
    if (!actualTimestamp) return 'Now';
    
    try {
      return formatSATime(actualTimestamp) || 'Now';
    } catch (error) {
      return 'Now';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioPlay = async () => {
    try {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current) {
          audioRef.current.volume = 1.0;
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
          }
        }
      }
    } catch (playError) {
      console.error('Play error:', playError);
      setAudioError(true);
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `voice_message_${Date.now()}.ogg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderAudioMessage = () => {
    if (!mediaUrl || audioError) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed max-w-lg",
            isFromCustomer 
              ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" 
              : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isFromCustomer
              ? "bg-slate-200 dark:bg-slate-800"
              : "bg-slate-300 dark:bg-slate-700"
          )}>
            <VolumeX className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isFromCustomer ? 'Voice Message' : 'AI Voice Response'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audio unavailable
            </p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border max-w-lg",
          isFromCustomer 
            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm" 
            : "bg-slate-900 dark:bg-white border-slate-700 dark:border-slate-300 shadow-lg"
        )}
      >
        {/* Audio player */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Play button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAudioPlay}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
                isFromCustomer
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>

            {/* Audio info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className={cn(
                  "w-4 h-4",
                  isFromCustomer 
                    ? "text-slate-600 dark:text-slate-400" 
                    : "text-slate-400 dark:text-slate-600"
                )} />
                <span className={cn(
                  "text-sm font-medium truncate",
                  isFromCustomer 
                    ? "text-slate-900 dark:text-slate-100" 
                    : "text-slate-100 dark:text-slate-900"
                )}>
                  {isFromCustomer ? 'Voice Message' : 'AI Response'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className={cn(
                  "h-1.5 rounded-full overflow-hidden",
                  isFromCustomer 
                    ? "bg-slate-200 dark:bg-slate-700" 
                    : "bg-slate-700 dark:bg-slate-200"
                )}>
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isFromCustomer
                        ? "bg-slate-900 dark:bg-white"
                        : "bg-white dark:bg-slate-900"
                    )}
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" 
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-mono",
                    isFromCustomer 
                      ? "text-slate-500 dark:text-slate-400" 
                      : "text-slate-400 dark:text-slate-500"
                  )}>
                    {formatDuration(currentTime)}
                  </span>
                  <span className={cn(
                    "text-xs font-mono",
                    isFromCustomer 
                      ? "text-slate-500 dark:text-slate-400" 
                      : "text-slate-400 dark:text-slate-500"
                  )}>
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Download button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100",
                isFromCustomer
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  : "bg-slate-800 dark:bg-slate-100 text-slate-400 dark:text-slate-600 hover:bg-slate-700 dark:hover:bg-slate-200"
              )}
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Waveform effect */}
        {isPlaying && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-1 opacity-30"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
          >
            <div className={cn(
              "h-full w-full",
              isFromCustomer
                ? "bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300"
                : "bg-gradient-to-r from-white to-slate-300 dark:from-slate-900 dark:to-slate-600"
            )} />
          </motion.div>
        )}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          preload="metadata"
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={(e) => {
            console.error('Audio error:', e);
            setAudioError(true);
            setIsPlaying(false);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        >
          <source src={mediaUrl} type="audio/ogg" />
          <source src={mediaUrl} type="audio/mpeg" />
          <source src={mediaUrl} type="audio/wav" />
        </audio>
      </motion.div>
    );
  }

  const renderImageMessage = () => {
    if (!mediaUrl) {
      return (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-w-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
              <span className="text-slate-600 dark:text-slate-300">🖼️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Image</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unable to load</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm"
      >
        <img 
          src={mediaUrl} 
          alt="Shared image"
          className="rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer max-w-full h-auto"
          onClick={() => window.electronAPI?.openExternal(mediaUrl)}
          onError={(e) => {
            console.error('Image load error:', e);
            e.target.style.display = 'none';
          }}
        />
        {(message.content || message.message_text) && (
          <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <MessageTextRenderer 
              text={message.content || message.message_text}
              isFromCustomer={isFromCustomer}
              enableFormatting={true}
            />
          </div>
        )}
      </motion.div>
    );
  };

  const renderTextMessage = () => {
    const text = message.content || message.message_text;
    if (!text) return null;

    return (
      <MessageTextRenderer 
        text={text}
        isFromCustomer={isFromCustomer}
        enableFormatting={true}
      />
    );
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'audio':
        return renderAudioMessage();
      case 'image':
      case 'photo':
        return renderImageMessage();
      default:
        return renderTextMessage();
    }
  };

  return (
    <div className={cn(
      "flex items-end gap-2 mb-4",
      isFromCustomer ? "justify-start" : "justify-end"
    )}>
      {isFromCustomer && (
        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 text-sm font-medium flex-shrink-0">
          {message.customer_name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
      )}
      
      <div className="flex flex-col max-w-lg lg:max-w-2xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "relative",
            message.message_type === 'audio' ? '' : cn(
              "px-4 py-3 rounded-2xl shadow-sm",
              isFromCustomer
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            )
          )}
          style={message.message_type !== 'audio' ? {
            borderBottomLeftRadius: isFromCustomer ? '8px' : '1rem',
            borderBottomRightRadius: isFromCustomer ? '1rem' : '8px',
          } : {}}
        >
          {renderMessageContent()}
        </motion.div>
        
        {/* Message metadata */}
        <div className={cn(
          "flex items-center gap-1 mt-1 px-1",
          isFromCustomer ? "justify-start" : "justify-end"
        )}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatTime()}
            </span>
          </div>
          
          {!isFromCustomer && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message.delivered ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3 text-slate-400" />
              )}
            </motion.div>
          )}
        </div>
      </div>
      
      {!isFromCustomer && (
        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 text-sm font-medium flex-shrink-0">
          AI
        </div>
      )}
    </div>
  );
}

// Export the memoized component
export default memo(MessageList);