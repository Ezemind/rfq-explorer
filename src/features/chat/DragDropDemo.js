import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image, File, CheckCircle, X } from 'lucide-react';
import DragDropOverlay from '../components/ui/DragDropOverlay';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useToast } from '../components/ui/Toast';

const DragDropDemo = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { addToast, ToastContainer } = useToast();
  
  const {
    dragActive,
    dragFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    formatFileSize,
    getFileIcon
  } = useDragAndDrop();

  const handleFileDropped = (file) => {
    // Simulate file upload
    const fileData = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    };
    
    setUploadedFiles(prev => [...prev, fileData]);
    addToast(`${file.name} uploaded successfully!`, 'success');
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    addToast('File removed', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            🚀 WhatsApp-Style Drag & Drop
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Drop files anywhere in the chat to send them instantly
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div
              className={`
                relative border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                ${dragActive 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, handleFileDropped)}
            >
              <motion.div
                animate={{ 
                  y: dragActive ? [0, -10, 0] : 0,
                  scale: dragActive ? 1.05 : 1
                }}
                transition={{ duration: 0.5 }}
              >
                <Upload className={`w-16 h-16 mx-auto mb-4 ${
                  dragActive ? 'text-blue-500' : 'text-slate-400'
                }`} />
                
                <h3 className={`text-xl font-semibold mb-2 ${
                  dragActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {dragActive ? 'Drop files here!' : 'Drag & Drop Zone'}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Drag images, documents, videos, or any file type
                </p>
                
                {dragFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-3 bg-white dark:bg-slate-700 rounded-lg border inline-block"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getFileIcon(dragFile)}</span>
                      <div className="text-left">
                        <p className="font-medium text-sm">{dragFile.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(dragFile.size)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Global drag overlay (shows when dragging over the entire area) */}
              <DragDropOverlay
                isActive={dragActive}
                dragFile={dragFile}
                formatFileSize={formatFileSize}
                showWhatsAppStyle={true}
              />
            </div>
          </motion.div>

          {/* Uploaded Files List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              Uploaded Files ({uploadedFiles.length})
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Drag files to the left to see them here</p>
                </div>
              ) : (
                uploadedFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getFileIcon({ type: file.type })}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(file.size)} • {file.uploadedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            ✨ Features
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">All File Types</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Images, videos, documents, archives - everything supported
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Instant Upload</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Drop anywhere in the chat to send immediately
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Smart Validation</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Automatic file type and size validation with helpful errors
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default DragDropDemo;