import React, { useState } from 'react';
import { Calendar, Settings, LogOut, Bell } from 'lucide-react';
import { ThemeToggle } from './ui/theme-toggle';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import NotificationSettings from '../features/notifications/NotificationSettings';

export default function Header({ user, theme, toggleTheme, onLogout, onAdminSettings, onCalendarView }) {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Bob Explorer V3</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">WhatsApp CRM</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCalendarView}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              title="Call Calendar"
            >
              <Calendar className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotificationSettings(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              title="Notification Settings"
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            {user.role === 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onAdminSettings}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                title="Admin Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
            
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.username}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
              
              <div className="relative">
                <button className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                  <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white dark:text-slate-900">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}
    </>
  );
}
