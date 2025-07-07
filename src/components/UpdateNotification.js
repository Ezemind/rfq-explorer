import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, X } from 'lucide-react';

const UpdateNotification = () => {
  const [updateState, setUpdateState] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');

  useEffect(() => {
    // Get current version
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(({ version }) => {
        setCurrentVersion(version);
      });

      // Listen for update events
      const removeUpdateAvailable = window.electronAPI.onUpdateAvailable((event, info) => {
        setUpdateState('available');
        setShowNotification(true);
      });

      const removeDownloadProgress = window.electronAPI.onDownloadProgress((event, progress) => {
        setDownloadProgress(Math.round(progress.percent));
        if (updateState !== 'downloading') {
          setUpdateState('downloading');
        }
      });

      const removeUpdateDownloaded = window.electronAPI.onUpdateDownloaded((event, info) => {
        setUpdateState('downloaded');
      });

      // Listen for update not available
      const removeUpdateNotAvailable = window.electronAPI.onUpdateNotAvailable?.((event, info) => {
        if (updateState === 'checking') {
          setUpdateState('not-available');
          setTimeout(() => {
            setShowNotification(false);
            setUpdateState(null);
          }, 3000);
        }
      });

      // Listen for update errors
      const removeUpdateError = window.electronAPI.onUpdateError?.((event, error) => {
        if (updateState === 'checking') {
          setUpdateState('error');
          setTimeout(() => {
            setShowNotification(false);
            setUpdateState(null);
          }, 5000);
        }
      });

      return () => {
        removeUpdateAvailable();
        removeDownloadProgress();
        removeUpdateDownloaded();
        removeUpdateNotAvailable?.();
        removeUpdateError?.();
      };
    }
  }, [updateState]);

  const handleInstallUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.quitAndInstall();
    }
  };

  const handleCheckForUpdates = () => {
    if (window.electronAPI) {
      window.electronAPI.checkForUpdates();
      setUpdateState('checking');
      setShowNotification(true);
      
      // Hide "checking" state after 5 seconds if no update found
      setTimeout(() => {
        if (updateState === 'checking') {
          setUpdateState(null);
          setShowNotification(false);
        }
      }, 5000);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification && updateState !== 'downloaded') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleCheckForUpdates}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
          title="Check for updates"
        >
          <Download size={16} />
          <span className="text-sm">v{currentVersion}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {updateState === 'checking' && (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Checking for updates...</h4>
                  <p className="text-sm text-gray-600">Current version: v{currentVersion}</p>
                </div>
              </>
            )}
            
            {updateState === 'available' && (
              <>
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Update Available</h4>
                  <p className="text-sm text-gray-600">A new version of RFQ Explorer is available.</p>
                </div>
              </>
            )}
            
            {updateState === 'downloading' && (
              <>
                <Download className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Downloading Update</h4>
                  <p className="text-sm text-gray-600">Progress: {downloadProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
            
            {updateState === 'not-available' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Up to Date</h4>
                  <p className="text-sm text-gray-600">You have the latest version (v{currentVersion})</p>
                </div>
              </>
            )}
            
            {updateState === 'error' && (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Update Check Failed</h4>
                  <p className="text-sm text-gray-600">Unable to check for updates. Please try again later.</p>
                </div>
              </>
            )}
            
            {updateState === 'downloaded' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Update Ready</h4>
                  <p className="text-sm text-gray-600">Restart to install the new version.</p>
                  <button
                    onClick={handleInstallUpdate}
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Restart & Install
                  </button>
                </div>
              </>
            )}
          </div>
          
          {updateState !== 'downloaded' && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
