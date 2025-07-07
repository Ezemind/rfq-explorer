import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

const UpdateSettings = () => {
  const [updateState, setUpdateState] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentVersion, setCurrentVersion] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Get current version
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(({ version }) => {
        setCurrentVersion(version);
      });

      // Listen for update status changes
      const removeUpdateStatus = window.electronAPI.onUpdateStatus?.((event, status) => {
        console.log('📊 Update status:', status);
        setUpdateState(status);
        if (status === 'checking') {
          setChecking(true);
        } else {
          setChecking(false);
        }
      });

      // Listen for update events
      const removeUpdateAvailable = window.electronAPI.onUpdateAvailable((event, info) => {
        console.log('✅ Update available:', info);
        setUpdateState('downloading');
        setChecking(false);
      });

      const removeDownloadProgress = window.electronAPI.onDownloadProgress((event, progress) => {
        console.log('📥 Download progress:', progress);
        setDownloadProgress(Math.round(progress.percent || 0));
        if (updateState !== 'downloading') {
          setUpdateState('downloading');
        }
      });

      const removeUpdateDownloaded = window.electronAPI.onUpdateDownloaded((event, info) => {
        console.log('✅ Update downloaded:', info);
        setUpdateState('downloaded');
      });

      const removeUpdateNotAvailable = window.electronAPI.onUpdateNotAvailable?.((event, info) => {
        console.log('ℹ️ Update not available:', info);
        setUpdateState('not-available');
        setChecking(false);
        setTimeout(() => {
          setUpdateState(null);
        }, 5000);
      });

      const removeUpdateError = window.electronAPI.onUpdateError?.((event, error) => {
        console.error('❌ Update error:', error);
        setUpdateState('error');
        setChecking(false);
        setTimeout(() => {
          setUpdateState(null);
        }, 8000);
      });

      return () => {
        removeUpdateStatus?.();
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
      setChecking(true);
      window.electronAPI.checkForUpdates();
      setUpdateState('checking');
      
      // Reset checking state after timeout if no response
      setTimeout(() => {
        if (updateState === 'checking') {
          setChecking(false);
          setUpdateState(null);
        }
      }, 10000);
    }
  };

  const getStatusBadge = () => {
    switch (updateState) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Checking...</span>
          </div>
        );
      case 'downloading':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Download className="h-4 w-4" />
            <span className="text-sm">Downloading {downloadProgress}%</span>
          </div>
        );
      case 'downloaded':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Update Ready</span>
          </div>
        );
      case 'not-available':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Up to Date</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Check Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-600">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Ready</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Download className="h-5 w-5 text-blue-500" />
        Application Updates
      </h4>
      
      <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Current Version
              </div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                v{currentVersion}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</div>
              {getStatusBadge()}
            </div>
          </div>

          {updateState === 'downloading' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                <span>Download Progress</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {updateState === 'downloaded' && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Update Ready to Install</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                A new version of RFQ Explorer has been downloaded and is ready to install. 
                The application will restart to complete the installation.
              </p>
              <Button
                onClick={handleInstallUpdate}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Restart & Install Now
              </Button>
            </div>
          )}

          {updateState === 'error' && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Update Check Failed</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">
                Unable to check for updates. Please check your internet connection and try again.
              </p>
            </div>
          )}

          {updateState === 'not-available' && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">You're Up to Date</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                You're running the latest version of RFQ Explorer.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCheckForUpdates}
              disabled={checking || updateState === 'downloading'}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check for Updates'}
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>• Updates are checked automatically on startup</div>
              <div>• Updates are downloaded in the background</div>
              <div>• Application restart is required to install updates</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateSettings;
