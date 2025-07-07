import React, { useRef, useEffect, useState } from 'react';
import { formatSATime } from '../../utils/timeZone';

export default function MessageList({ messages, loading, customerPhone }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#f0f2f5' }}>
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start the conversation below</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <MessageBubble 
            key={message.id || index}
            message={message}
            isFromCustomer={message.sender === 'customer'}
            customerPhone={customerPhone}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message, isFromCustomer, customerPhone }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    console.log('🔍 Message:', message);
    console.log('🔍 Media URL:', message.media_url);
    
    if (message.message_type === 'audio' && message.media_url) {
      setMediaUrl(message.media_url);
      setAudioError(false);
    }
  }, [message]);

  // Reset audio when mediaUrl changes
  useEffect(() => {
    if (audioRef.current && mediaUrl) {
      audioRef.current.load();
    }
  }, [mediaUrl]);

  const handleRightClick = (e) => {
    e.preventDefault();
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

  const formatTime = (timestamp) => {
    return formatSATime(timestamp);
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'audio':
        return (
          <div>
            {mediaUrl && !audioError ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm w-full shadow-sm">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        if (isPlaying) {
                          audioRef.current?.pause();
                          setIsPlaying(false);
                        } else {
                          if (audioRef.current) {
                            audioRef.current.volume = 1.0;
                            audioRef.current.currentTime = 0;
                            const playPromise = audioRef.current.play();
                            
                            if (playPromise !== undefined) {
                              await playPromise;
                              setIsPlaying(true);
                            }
                          }
                        }
                      } catch (playError) {
                        console.error('❌ Play error:', playError);
                        setAudioError(true);
                        setIsPlaying(false);
                      }
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
                      isPlaying
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } shadow-md hover:shadow-lg text-xl`}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">🎵</span>
                      <span className="text-sm font-medium text-blue-700">
                        {isFromCustomer ? 'Voice Message' : 'AI Voice Response'}
                      </span>
                      <span className="text-sm text-blue-600">🔊</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-blue-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-blue-300'
                          }`}
                          style={{ width: isPlaying ? '100%' : '20%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Audio unavailable or error
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 max-w-sm w-full shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white text-xl">
                    {audioError ? '❌' : '🤖'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🎤</span>
                      <span className="text-sm font-medium text-gray-700">
                        {isFromCustomer ? 'Voice Message' : 'AI Voice Response'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {audioError ? 'Unable to play audio' : 'Audio file not available'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden audio element */}
            {mediaUrl && (
              <audio
                ref={audioRef}
                preload="auto"
                crossOrigin="anonymous"
                onContextMenu={handleRightClick}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('❌ Audio error:', e);
                  setAudioError(true);
                  setIsPlaying(false);
                }}
                onLoadStart={() => console.log('🔄 Audio loading started')}
                onCanPlay={() => console.log('✅ Audio can play')}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              >
                <source src={mediaUrl} type="audio/ogg" />
                <source src={mediaUrl} type="audio/mpeg" />
                <source src={mediaUrl} type="audio/wav" />
              </audio>
            )}
          </div>
        );

      case 'image':
        return (
          <div>
            {message.media_url && (
              <div className="mb-2">
                <p className="text-xs mb-1">🖼️ Image message</p>
                <img
                  src={message.media_url}
                  alt="Shared image"
                  className="max-w-xs rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', message.media_url);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            {message.content && <p className="mt-2">{message.content}</p>}
          </div>
        );

      case 'document':
        return (
          <div>
            {message.media_url && (
              <div className="mb-2">
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>📎 Download Document</span>
                </a>
              </div>
            )}
            {message.content && <p className="mt-2">{message.content}</p>}
          </div>
        );

      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <div className={`flex ${isFromCustomer ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
          isFromCustomer
            ? 'bg-white text-gray-900 border border-gray-200'
            : 'bg-green-500 text-white'
        }`}
        style={{
          borderBottomLeftRadius: isFromCustomer ? '4px' : '1rem',
          borderBottomRightRadius: isFromCustomer ? '1rem' : '4px',
        }}
      >
        {renderMessageContent()}
        
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${isFromCustomer ? 'text-gray-500' : 'text-green-100'}`}>
            {formatTime(message.created_at)}
          </span>
          {message.sender === 'staff' && (
            <span className="text-xs text-green-100">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
