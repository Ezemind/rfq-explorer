import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Video, Music, FileText, File, Archive } from 'lucide-react';

const DragDropOverlay = ({ 
  isActive, 
  dragFile, 
  formatFileSize, 
  showWhatsAppStyle = false 
}) => {
  const getFileIconComponent = (file) => {
    if (!file) return <Upload className="w-16 h-16 text-blue-500" />;
    
    if (file.type.startsWith('image/')) return <Image className="w-12 h-12 text-green-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-12 h-12 text-red-500" />;
    if (file.type.startsWith('audio/')) return <Music className="w-12 h-12 text-purple-500" />;
    if (file.type.includes('pdf')) return <FileText className="w-12 h-12 text-red-600" />;
    if (file.type.includes('word')) return <FileText className="w-12 h-12 text-blue-600" />;
    if (file.type.includes('excel')) return <FileText className="w-12 h-12 text-green-600" />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="w-12 h-12 text-orange-500" />;
    return <File className="w-12 h-12 text-slate-500" />;
  };

  const getFileEmoji = (file) => {
    if (!file) return '📎';
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel')) return '📊';
    if (file.type.includes('zip') || file.type.includes('rar')) return '🗜️';
    return '📎';
  };

  if (showWhatsAppStyle) {
    return (
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-green-50/95 dark:bg-green-950/95 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 border-2 border-green-200 dark:border-green-800"
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="mb-4"
                >
                  {dragFile ? (
                    <div className="w-20 h-20 mx-auto mb-2 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">{getFileEmoji(dragFile)}</span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 mx-auto mb-2 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center">
                      <Upload className="w-10 h-10 text-green-600" />
                    </div>
                  )}
                </motion.div>
                
                {dragFile && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {dragFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatFileSize(dragFile.size)}
                    </p>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                  Send {dragFile ? dragFile.name : 'File'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Drop here to send instantly
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-blue-50/95 dark:bg-blue-950/95 backdrop-blur-sm border-4 border-dashed border-blue-400 dark:border-blue-600 rounded-lg flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-800 max-w-md mx-4"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              {dragFile ? getFileIconComponent(dragFile) : <Upload className="w-16 h-16 text-blue-500 mx-auto" />}
            </motion.div>
            
            {dragFile && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div className="flex items-center justify-center space-x-3">
                  {getFileIconComponent(dragFile)}
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {dragFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(dragFile.size)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Drop to send file
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Release to send {dragFile ? dragFile.name : 'this file'} instantly
            </p>
            
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>✅ Images, Videos, Audio</p>
              <p>✅ Documents (PDF, Word, Excel)</p>
              <p>✅ Archives (ZIP, RAR)</p>
              <p className="font-medium">📏 Max size: 50MB</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DragDropOverlay;