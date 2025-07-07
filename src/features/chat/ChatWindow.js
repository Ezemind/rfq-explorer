import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import StaffAssignment from './StaffAssignment';
import DragDropOverlay from '../../components/ui/DragDropOverlay';
import AIToggleButton from '../../components/ui/AIToggleButton';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useToast } from '../../components/ui/Toast';
import { safeSendFile } from '../../utils/fileUtils';
import { getStaffColor } from '../../utils/staffColors';

// Cache for messages to avoid reloading when switching between chats
const messageCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export default function ChatWindow({ selectedChat, onSendMessage, onCustomerDetails, onChatUpdate, user, onSetMessageAddCallback }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false); // Prevent duplicate loading
  const lastLoadedChatId = useRef(null);
  
  // Use the drag and drop hook
  const {
    dragActive,
    dragFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    formatFileSize,
    resetDragState
  } = useDragAndDrop();

  // Use toast notifications
  const { addToast, removeToast, ToastContainer } = useToast();

  // Optimized function to add a new message directly to the state
  const addMessage = useCallback((newMessage) => {
    setMessages(prevMessages => {
      // Check if message already exists (by content and timestamp to avoid duplicates)
      const messageExists = prevMessages.some(msg => 
        msg.content === newMessage.content && 
        Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 5000 && // Within 5 seconds
        msg.sender === newMessage.sender
      );
      
      if (messageExists) {
        console.log('🚫 Duplicate message detected, skipping:', newMessage.content);
        return prevMessages;
      }
      
      console.log('✅ Adding new message:', newMessage.content);
      const updatedMessages = [...prevMessages, newMessage];
      
      // Update cache
      if (selectedChat) {
        messageCache.set(selectedChat.id, {
          messages: updatedMessages,
          timestamp: Date.now()
        });
      }
      
      return updatedMessages;
    });
    
    // Scroll to bottom when new message is added
    setTimeout(() => {
      const messagesContainer = document.querySelector('[data-messages-container]');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }, [selectedChat]);

  // Set up the callback for Dashboard to use
  useEffect(() => {
    if (onSetMessageAddCallback) {
      onSetMessageAddCallback(() => addMessage);
    }
  }, [onSetMessageAddCallback, addMessage]);

  // Fast loading with cache check
  useEffect(() => {
    if (selectedChat && selectedChat.id !== lastLoadedChatId.current) {
      loadMessages();
      lastLoadedChatId.current = selectedChat.id;
    }
  }, [selectedChat?.id]);

  const loadMessages = useCallback(async () => {
    if (!selectedChat || loadingRef.current) return;
    
    // Check cache first for instant loading
    const cached = messageCache.get(selectedChat.id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Loading messages from cache for session:', selectedChat.id);
      setMessages(cached.messages);
      return;
    }
    
    // If it's an RFQ, we don't have messages yet
    if (selectedChat.source_type === 'rfq') {
      setMessages([]);
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await window.electronAPI.query(`
        SELECT 
          id,
          sender_type as sender,
          message_text as content,
          message_type,
          created_at as timestamp,
          media_url,
          staff_user_id
        FROM chat_messages 
        WHERE session_id = $1 
        ORDER BY created_at ASC
      `, [selectedChat.id]);

      if (result.success) {
        setMessages(result.data);
        
        // Cache the messages
        messageCache.set(selectedChat.id, {
          messages: result.data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [selectedChat]);

  const handleAssignmentChange = (staffId) => {
    // Update the selected chat with new assignment
    if (onChatUpdate) {
      onChatUpdate({
        ...selectedChat,
        assigned_staff_id: staffId
      });
    }
  };

  // Handle file drop specifically for chat
  const handleFileDrop = async (file) => {
    if (!selectedChat || selectedChat.session_status === 'closed') {
      addToast('Cannot send files to closed sessions', 'error');
      return;
    }

    const toastId = addToast(`Sending ${file.name}...`, 'loading', 0);

    try {
      // If it's an RFQ, convert it to a chat session first
      if (selectedChat.source_type === 'rfq') {
        await convertRFQToChat();
      }

      // Send the file directly using safe file sending
      const messageData = {
        content: `📎 ${file.name}`,
        sender: 'staff',
        timestamp: new Date().toISOString(),
        message_type: 'file',
        staff_user_id: user.id
      };

      const result = await safeSendFile(file, selectedChat.customer_phone, messageData);
      
      if (result.success) {
        removeToast(toastId);
        addToast(`${file.name} sent successfully!`, 'success');
        loadMessages(); // Refresh messages after sending
      } else {
        throw new Error(result.error || 'Failed to send file');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      removeToast(toastId);
      addToast(`Failed to send ${file.name}: ${error.message}`, 'error');
    }
  };

  const handleSendMessage = async (messageData) => {
    // If it's an RFQ, convert it to a chat session first
    if (selectedChat.source_type === 'rfq') {
      await convertRFQToChat();
    }

    const result = await onSendMessage(messageData);
    if (result.success) {
      loadMessages(); // Refresh messages after sending
    }
    return result;
  };

  const convertRFQToChat = async () => {
    try {
      // Create a chat session for this RFQ
      const result = await window.electronAPI.query(`
        INSERT INTO chat_sessions (customer_phone, session_id, status, created_at, last_message_at)
        VALUES ($1, $2, 'active', NOW(), NOW())
        RETURNING *
      `, [selectedChat.customer_phone, `session_${selectedChat.customer_phone}`]);

      if (result.success && result.data.length > 0) {
        const newSession = result.data[0];
        // Update the selected chat to reference the new session
        onChatUpdate({
          ...selectedChat,
          id: newSession.id,
          source_type: 'chat',
          session_status: 'active'
        });
      }
    } catch (error) {
      console.error('Error converting RFQ to chat:', error);
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Select a conversation</h3>
          <p className="text-slate-500 dark:text-slate-400">Choose a chat from the sidebar to start messaging</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 flex flex-col bg-white dark:bg-black relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        handleDrop(e, handleFileDrop);
      }}
    >
      {/* Drag and Drop Overlay */}
      <AnimatePresence>
        {dragActive && (
          <DragDropOverlay 
            dragFile={dragFile}
            formatFileSize={formatFileSize}
          />
        )}
      </AnimatePresence>

      {/* Chat Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-semibold">
              {selectedChat.customer_name ? selectedChat.customer_name.charAt(0).toUpperCase() : selectedChat.customer_phone.slice(-2)}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedChat.customer_name || selectedChat.customer_phone}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedChat.customer_phone}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AIToggleButton customerPhone={selectedChat.customer_phone} />
            <button 
              onClick={() => onCustomerDetails && onCustomerDetails(selectedChat)}
              className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Customer Details
            </button>
            {selectedChat && (
              <StaffAssignment 
                selectedChat={selectedChat}
                onAssignmentChange={handleAssignmentChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      {selectedChat.source_type === 'rfq' ? (
        <RFQDetailsView rfq={selectedChat} onStartChat={convertRFQToChat} />
      ) : (
        <MessageList 
          messages={messages} 
          loading={loading}
          customerPhone={selectedChat.customer_phone}
        />
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={selectedChat.session_status === 'closed'}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

function RFQDetailsView({ rfq, onStartChat }) {
  const [rfqDetails, setRfqDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRFQDetails();
  }, [rfq.id]);

  const loadRFQDetails = async () => {
    try {
      // Get RFQ details with products
      const result = await window.electronAPI.query(`
        SELECT 
          r.*,
          array_agg(
            json_build_object(
              'id', rp.id,
              'product_name', rp.product_name,
              'quantity', rp.quantity,
              'specifications', rp.specifications
            )
          ) as products
        FROM rfqs r
        LEFT JOIN rfq_products rp ON r.id = rp.rfq_id
        WHERE r.id = $1
        GROUP BY r.id
      `, [rfq.id]);

      if (result.success && result.data.length > 0) {
        setRfqDetails(result.data[0]);
      }
    } catch (error) {
      console.error('Error loading RFQ details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfqDetails) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">RFQ not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Request for Quotation
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              From: {rfqDetails.customer_name || rfqDetails.customer_phone}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Submitted: {new Date(rfqDetails.created_at).toLocaleDateString()}
            </p>
          </div>

          {rfqDetails.products && rfqDetails.products.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                Requested Products
              </h3>
              <div className="space-y-4">
                {rfqDetails.products.filter(p => p.id).map((product, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {product.product_name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Quantity: {product.quantity}
                    </p>
                    {product.specifications && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Specifications: {product.specifications}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={onStartChat}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Chat Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
