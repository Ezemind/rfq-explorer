// Test utility to verify file conversion
import { convertFileForIPC, validateFile, safeSendFile } from '../utils/fileUtils';

export const testFileConversion = async (file) => {
  console.log('🧪 Testing file conversion for:', file.name);
  
  try {
    // Step 1: Validate file
    console.log('📋 Step 1: Validating file...');
    const validation = validateFile(file);
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.error);
      return { success: false, error: validation.error };
    }
    console.log('✅ File validation passed');
    
    // Step 2: Convert file
    console.log('🔄 Step 2: Converting file to IPC format...');
    const convertedFile = await convertFileForIPC(file);
    console.log('✅ File converted successfully:', {
      name: convertedFile.name,
      type: convertedFile.type,
      size: convertedFile.size,
      extension: convertedFile.extension,
      dataLength: convertedFile.data?.byteLength || 0
    });
    
    // Step 3: Test serialization
    console.log('📦 Step 3: Testing JSON serialization...');
    try {
      const serialized = JSON.stringify({
        ...convertedFile,
        data: Array.from(new Uint8Array(convertedFile.data)) // Convert ArrayBuffer to array for JSON
      });
      console.log('✅ Serialization test passed, size:', (serialized.length / 1024).toFixed(2), 'KB');
    } catch (jsonError) {
      console.error('❌ Serialization failed:', jsonError);
      return { success: false, error: 'Failed to serialize file data' };
    }
    
    return { 
      success: true, 
      convertedFile,
      message: 'File conversion successful - ready for IPC transmission' 
    };
    
  } catch (error) {
    console.error('❌ File conversion test failed:', error);
    return { success: false, error: error.message };
  }
};

// Mock send function for testing
export const mockSendFunction = async (messageData) => {
  console.log('📤 Mock send function called with:', {
    type: messageData.type,
    content: messageData.content,
    hasFile: !!messageData.file,
    fileData: messageData.file ? {
      name: messageData.file.name,
      type: messageData.file.type,
      size: messageData.file.size,
      hasData: !!messageData.file.data
    } : null
  });
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true, message: 'Mock send successful' };
};

// Test the complete flow
export const testCompleteFlow = async (file) => {
  console.log('🚀 Testing complete file sending flow...');
  
  try {
    const messageData = {
      content: `📎 ${file.name}`,
      type: 'file',
      file: file
    };
    
    const result = await safeSendFile(messageData, mockSendFunction);
    console.log('✅ Complete flow test result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Complete flow test failed:', error);
    return { success: false, error: error.message };
  }
};