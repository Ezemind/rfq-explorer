// Custom hook for drag and drop file handling
import { useState, useCallback } from 'react';
import { validateFile, formatFileSize, getFileIconEmoji } from '../utils/fileUtils';

export const useDragAndDrop = () => {
  const [dragActive, setDragActive] = useState(false);
  const [dragFile, setDragFile] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
    
    // Preview the file being dragged
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDragFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide if leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false);
      setDragFile(null);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDrop = useCallback((e, onFileAccepted) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragFile(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validation = validateFile(file);
      
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      if (onFileAccepted) {
        onFileAccepted(file);
      }
    }
  }, [validateFile]);

  const getFileIcon = useCallback((file) => {
    if (!file) return '📎';
    return getFileIconEmoji(file.type);
  }, []);

  const formatFileSizeWrapper = useCallback((bytes) => {
    return formatFileSize(bytes);
  }, []);

  const resetDragState = useCallback(() => {
    setDragActive(false);
    setDragFile(null);
  }, []);

  return {
    dragActive,
    dragFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    getFileIcon,
    formatFileSize: formatFileSizeWrapper,
    resetDragState,
    validateFile
  };
};