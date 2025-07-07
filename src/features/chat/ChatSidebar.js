import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Clock, User, Mail } from 'lucide-react';
import { formatSATime, formatSADate } from '../../utils/timeZone';
import { getStaffColor } from '../../utils/staffColors';
import AIStatusIndicator from '../../components/ui/AIStatusIndicator';

export default function ChatSidebar({ chats, selectedChat, onChatSelect, loading }) {
  if (loading) {
    return (
      <div className="w-96 bg-white dark:bg-black border-r border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Chats</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading conversations...</p>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex space-x-3"
            >
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white dark:bg-black border-r border-slate-200 dark:border-slate-800 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Chats</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-1">No active conversations</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">New chats will appear here</p>
          </motion.div>
        ) : (
          <div className="p-1 space-y-0.5">
            <AnimatePresence>
              {chats.map((chat, index) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ChatItem 
                    chat={chat}
                    isSelected={selectedChat?.id === chat.id}
                    onClick={() => onChatSelect(chat)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat, isSelected, onClick }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Parse the timestamp
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) return '';
    
    // Get current time in South Africa timezone
    const now = new Date();
    const saFormatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const messageFormatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const nowDateString = saFormatter.format(now);
    const messageDateString = messageFormatter.format(messageDate);
    
    // If same date in SA timezone, show time, otherwise show date
    if (nowDateString === messageDateString) {
      return formatSATime(timestamp);
    } else {
      return formatSADate(timestamp);
    }
  };

  const truncateMessage = (message, maxLength = 45) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const isRFQ = chat.source_type === 'rfq';
  const staffColor = getStaffColor(chat.staff_assigned || 'default');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-2 rounded-lg cursor-pointer transition-all duration-200 group ${
        isSelected 
          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* RFQ indicator */}
      {isRFQ && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-xl" />
      )}
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs ${
            isRFQ 
              ? 'bg-orange-500 text-white' 
              : isSelected 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white' 
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
          }`}>
            {isRFQ ? '₽' : (chat.customer_name ? chat.customer_name.charAt(0).toUpperCase() : chat.customer_phone.slice(-2))}
          </div>
          
          {/* Status indicator - Fixed visibility */}
          {chat.session_status === 'active' && !isRFQ && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center">
              <div className="w-1 h-1 bg-white dark:bg-black rounded-full animate-pulse" />
            </div>
          )}
          
          {isRFQ && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center">
              <div className="w-1 h-1 bg-white dark:bg-black rounded-full" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`font-medium truncate text-sm ${
                isSelected 
                  ? 'text-white dark:text-slate-900' 
                  : 'text-slate-900 dark:text-slate-100'
              }`}>
                {chat.customer_name || chat.customer_phone}
                {isRFQ && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    isSelected 
                      ? 'bg-orange-200 text-orange-800' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  }`}>
                    RFQ
                  </span>
                )}
              </h3>
              
              {/* Email notification badge */}
              {chat.has_unread_emails && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full animate-pulse">
                  <Mail className="w-3 h-3" />
                  <span className="text-xs font-medium">{chat.unread_email_count}</span>
                </div>
              )}
              
              {/* AI Status Indicator */}
              <AIStatusIndicator customerPhone={chat.customer_phone} />
            </div>
            
            <span className={`text-xs ${
              isSelected 
                ? 'text-white dark:text-slate-900' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {formatTime(chat.last_message_at)}
            </span>
          </div>
          
          <p className={`text-xs opacity-80 truncate mb-1 ${
            isSelected 
              ? 'text-white dark:text-slate-900' 
              : 'text-slate-600 dark:text-slate-400'
          }`}>
            {truncateMessage(chat.last_message)}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isSelected ? (
                chat.session_status === 'active' ? 'bg-green-200 text-green-800' :
                chat.session_status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                chat.session_status === 'processing' ? 'bg-orange-200 text-orange-800' :
                'bg-slate-200 text-slate-800'
              ) : (
                chat.session_status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                chat.session_status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                chat.session_status === 'processing' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              )
            }`}>
              {isRFQ ? 'RFQ Processing' : chat.session_status}
            </span>
            
            {chat.staff_assigned && (
              <div className={`flex items-center gap-1 text-xs ${
                isSelected 
                  ? `${staffColor.textLight} dark:${staffColor.textDark}` 
                  : `${staffColor.text} dark:${staffColor.textDark}`
              }`}>
                <User className="w-3 h-3" />
                <span className="font-medium">{chat.staff_assigned}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}