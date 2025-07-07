import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, X, Upload, Smile, Image, FileText, Video, Music, File } from 'lucide-react';
import EmojiPicker from '../../components/ui/EmojiPicker';
import { parseEmojis } from '../../utils/emojiParser';
import { safeSendFile, validateFile } from '../../utils/fileUtils';
import { useToast } from '../../components/ui/Toast';

export default function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Use toast notifications
  const { addToast, removeToast } = useToast();

  // Local drag state for input area only
  const [inputDragActive, setInputDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || sending || disabled) return;

    setSending(true);
    let toastId = null;
    
    try {
      let messageData;
      
      if (selectedFile) {
        console.log('📎 Sending file:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size
        });
        
        // Show loading toast for file uploads
        toastId = addToast(`Sending ${selectedFile.name}...`, 'loading', 0);
        
        messageData = {
          content: message.trim() || `📎 ${selectedFile.name}`,
          type: 'file',
          file: selectedFile
        };
      } else {
        // Parse emojis before sending
        const parsedMessage = parseEmojis(message.trim());
        messageData = {
          content: parsedMessage,
          type: 'text'
        };
      }

      console.log('🚀 Calling safeSendFile with messageData:', {
        type: messageData.type,
        content: messageData.content,
        hasFile: !!messageData.file
      });

      // Use safe file sending that handles IPC conversion
      const result = await safeSendFile(messageData, onSendMessage);

      console.log('📨 Send result:', result);

      // Remove loading toast if it was created
      if (toastId) {
        removeToast(toastId);
      }

      if (result.success) {
        setMessage('');
        setSelectedFile(null);
        setShowEmojiPicker(false);
        
        // Show success toast for file uploads
        if (selectedFile) {
          addToast(`${selectedFile.name} sent successfully!`, 'success');
        }
      } else {
        // Show error toast instead of alert
        addToast(`Failed to send ${selectedFile ? selectedFile.name : 'message'}: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Send error:', error);
      
      // Remove loading toast if it was created
      if (toastId) {
        removeToast(toastId);
      }
      
      // Show error toast instead of alert
      addToast(`Failed to send ${selectedFile ? selectedFile.name : 'message'}: ${error.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    // Parse emoji codes as user types
    const parsedValue = parseEmojis(value);
    setMessage(parsedValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setInputDragActive(true);
    } else if (e.type === 'dragleave') {
      setInputDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInputDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      addToast(validation.error, 'error');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-500" />;
    if (file.type.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    if (file.type.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (file.type.includes('excel')) return <FileText className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  if (disabled) {
    return (
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center">
        <p className="text-slate-500 dark:text-slate-400">This conversation is closed</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        className={`border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-4 transition-all duration-200 ${
          inputDragActive ? 'bg-slate-50 dark:bg-slate-900 border-slate-400 dark:border-slate-600' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Selected file preview */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  {getFileIcon(selectedFile)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={removeSelectedFile}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <AnimatePresence>
          {inputDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-lg flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Drop to attach file</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? "Add a message (optional)..." : "Type a message or drag files here..."}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200"
              rows="1"
              style={{ 
                minHeight: '44px', 
                maxHeight: '120px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              disabled={sending}
            />
          </div>
          
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                showEmojiPicker 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={(!message.trim() && !selectedFile) || sending}
              className="w-11 h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg"
            >
              {sending ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </form>
      </div>
      
      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
      />
    </div>
  );
}