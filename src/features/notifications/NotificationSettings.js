import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock, Volume2, Settings, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import notificationService from './NotificationService';

export default function NotificationSettings({ onClose }) {
  const [settings, setSettings] = useState({
    enabled: true,
    browserNotifications: true,
    inAppNotifications: true,
    soundEnabled: true,
    reminderIntervals: {
      '24h': true,   // 24 hours before
      '1h': true,    // 1 hour before
      '15m': true,   // 15 minutes before
      '5m': true,    // 5 minutes before
      'now': true    // At call time
    }
  });
  
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [serviceStats, setServiceStats] = useState({});

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Get service stats
    setServiceStats(notificationService.getStats());
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        const newSettings = { ...settings, browserNotifications: true };
        saveSettings(newSettings);
      }
    }
  };

  const testNotification = () => {
    // Create a test call object
    const testCall = {
      id: 'test',
      customer_name: 'Test Customer',
      customer_phone: '+27123456789',
      scheduled_at: new Date().toISOString(),
      call_type: 'follow_up'
    };

    // Send test notification
    notificationService.sendCallReminder(testCall, {
      time: 5,
      label: '5 minutes',
      key: 'test-5m'
    });
  };

  const toggleSetting = (key, value = null) => {
    const newSettings = { ...settings };
    
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      newSettings[parent] = { ...newSettings[parent], [child]: value ?? !newSettings[parent][child] };
    } else {
      newSettings[key] = value ?? !newSettings[key];
    }
    
    saveSettings(newSettings);
  };

  const getReminderLabel = (interval) => {
    const labels = {
      '24h': '24 hours before',
      '1h': '1 hour before',
      '15m': '15 minutes before',
      '5m': '5 minutes before',
      'now': 'At call time'
    };
    return labels[interval];
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { color: 'text-green-600', icon: '✅', text: 'Allowed' };
      case 'denied':
        return { color: 'text-red-600', icon: '❌', text: 'Blocked' };
      default:
        return { color: 'text-yellow-600', icon: '⚠️', text: 'Not requested' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Notification Settings
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Configure call reminders and alerts
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Service Running</span>
                  <Badge variant={serviceStats.isRunning ? "success" : "destructive"}>
                    {serviceStats.isRunning ? 'Active' : 'Stopped'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Browser Permission</span>
                  <div className={`text-sm font-medium ${permissionStatus.color}`}>
                    {permissionStatus.icon} {permissionStatus.text}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Active Notifications</span>
                  <Badge variant="secondary">
                    {serviceStats.notifiedCalls || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Main Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Enable Notifications
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive call reminders and alerts
                    </p>
                  </div>
                  <Button
                    variant={settings.enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('enabled')}
                  >
                    {settings.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Browser Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Browser Notifications
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Show system notifications outside the app
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationPermission !== 'granted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestNotificationPermission}
                      >
                        Request Permission
                      </Button>
                    )}
                    <Button
                      variant={settings.browserNotifications ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSetting('browserNotifications')}
                      disabled={notificationPermission !== 'granted'}
                    >
                      {settings.browserNotifications ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* In-App Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      In-App Notifications
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Show notification popups within the application
                    </p>
                  </div>
                  <Button
                    variant={settings.inAppNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('inAppNotifications')}
                  >
                    {settings.inAppNotifications ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Sound Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Notification Sounds
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Play audio alerts for reminders
                    </p>
                  </div>
                  <Button
                    variant={settings.soundEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('soundEnabled')}
                  >
                    {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reminder Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Timing
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose when you want to receive call reminders
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(settings.reminderIntervals).map(([interval, enabled]) => (
                  <div key={interval} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {getReminderLabel(interval)}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {interval === 'now' ? 'Final reminder when call time arrives' :
                         interval === '5m' ? 'Last chance to prepare' :
                         interval === '15m' ? 'Time to wrap up current tasks' :
                         interval === '1h' ? 'Plan your schedule' :
                         'Early advance notice'}
                      </p>
                    </div>
                    <Button
                      variant={enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSetting(`reminderIntervals.${interval}`)}
                    >
                      {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Section */}
            <Card>
              <CardHeader>
                <CardTitle>Test Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Send Test Notification
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Test your notification settings with a sample reminder
                    </p>
                  </div>
                  <Button onClick={testNotification} disabled={!settings.enabled}>
                    Test Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
