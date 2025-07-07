import { formatSATime, formatSADate } from '../../utils/timeZone';

class NotificationService {
  constructor() {
    this.checkInterval = null;
    this.notifiedCalls = new Set();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }

    // Start checking for upcoming calls
    this.startChecking();
    this.isInitialized = true;
  }

  startChecking() {
    // Check every minute for upcoming calls
    this.checkInterval = setInterval(() => {
      this.checkUpcomingCalls();
    }, 60000); // 1 minute

    // Also check immediately
    this.checkUpcomingCalls();
  }

  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkUpcomingCalls() {
    try {
      const now = new Date();
      const upcoming = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

      // Get calls scheduled for the next 24 hours
      const result = await window.electronAPI.query(`
        SELECT 
          sc.*,
          su.first_name as staff_first_name,
          su.last_name as staff_last_name,
          c.name as customer_name,
          c.company as customer_company
        FROM scheduled_calls sc
        LEFT JOIN staff_users su ON sc.assigned_staff_id = su.id
        LEFT JOIN customers c ON c.phone = sc.customer_phone
        WHERE sc.scheduled_at BETWEEN $1 AND $2 
        AND sc.status = 'scheduled'
        ORDER BY sc.scheduled_at ASC
      `, [now.toISOString(), upcoming.toISOString()]);

      if (result.success) {
        result.data.forEach(call => {
          this.checkCallReminders(call);
        });
      }
    } catch (error) {
      console.error('Error checking upcoming calls:', error);
    }
  }

  checkCallReminders(call) {
    const now = new Date();
    const callTime = new Date(call.scheduled_at);
    const timeDiff = callTime.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));

    // Define reminder intervals (in minutes)
    const reminderIntervals = [
      { time: 1440, label: '24 hours', key: `${call.id}-24h` }, // 24 hours
      { time: 60, label: '1 hour', key: `${call.id}-1h` },      // 1 hour
      { time: 15, label: '15 minutes', key: `${call.id}-15m` }, // 15 minutes
      { time: 5, label: '5 minutes', key: `${call.id}-5m` },    // 5 minutes
      { time: 0, label: 'now', key: `${call.id}-now` }          // Call time
    ];

    reminderIntervals.forEach(reminder => {
      // Check if we should send this reminder
      if (Math.abs(minutesUntil - reminder.time) <= 1 && !this.notifiedCalls.has(reminder.key)) {
        this.sendCallReminder(call, reminder);
        this.notifiedCalls.add(reminder.key);
      }
    });

    // Clean up old notifications (older than 2 hours)
    if (timeDiff < -2 * 60 * 60 * 1000) {
      reminderIntervals.forEach(reminder => {
        this.notifiedCalls.delete(reminder.key);
      });
    }
  }

  sendCallReminder(call, reminder) {
    const customerName = call.customer_name || call.customer_phone;
    const callTime = formatSATime(call.scheduled_at);
    const callDate = formatSADate(call.scheduled_at);

    let title, body;

    if (reminder.time === 0) {
      title = `📞 Call Time!`;
      body = `Your call with ${customerName} is scheduled now`;
    } else {
      title = `⏰ Call Reminder`;
      body = `Call with ${customerName} in ${reminder.label} (${callTime})`;
    }

    // Send browser notification
    this.sendBrowserNotification(title, body, call);

    // Send in-app notification
    this.sendInAppNotification(title, body, call, reminder);

    // Play notification sound
    this.playNotificationSound(reminder.time);
  }

  sendBrowserNotification(title, body, call) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png', // Make sure you have this icon
        badge: '/icon-72x72.png',
        tag: `call-${call.id}`, // Prevent duplicate notifications
        requireInteraction: true, // Keep notification visible
        actions: [
          { action: 'view', title: 'View Call' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });

      notification.onclick = () => {
        // Focus the app window
        window.focus();
        
        // You can dispatch a custom event to open the calendar
        window.dispatchEvent(new CustomEvent('openCall', { 
          detail: { callId: call.id } 
        }));
        
        notification.close();
      };

      // Auto-close after 10 seconds for non-urgent reminders
      if (call.scheduled_at - new Date() > 5 * 60 * 1000) {
        setTimeout(() => notification.close(), 10000);
      }
    }
  }

  sendInAppNotification(title, body, call, reminder) {
    // Create in-app notification element
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 max-w-sm bg-white dark:bg-slate-800 
      border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4
      transform transition-all duration-300 ease-in-out
    `;
    
    const urgencyClass = reminder.time <= 5 ? 'border-l-4 border-l-red-500' : 
                        reminder.time <= 15 ? 'border-l-4 border-l-orange-500' :
                        'border-l-4 border-l-blue-500';
    
    notification.className += ` ${urgencyClass}`;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 text-2xl">
          ${reminder.time <= 5 ? '🔴' : reminder.time <= 15 ? '🟡' : '🔵'}
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-slate-900 dark:text-slate-100 text-sm">${title}</h4>
          <p class="text-slate-600 dark:text-slate-400 text-sm mt-1">${body}</p>
          <div class="flex gap-2 mt-3">
            <button class="view-call-btn text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              View Call
            </button>
            <button class="dismiss-btn text-xs px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600">
              Dismiss
            </button>
          </div>
        </div>
        <button class="close-btn flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    // Add event listeners
    notification.querySelector('.view-call-btn').onclick = () => {
      window.dispatchEvent(new CustomEvent('openCall', { 
        detail: { callId: call.id } 
      }));
      notification.remove();
    };

    notification.querySelector('.dismiss-btn').onclick = () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    };

    notification.querySelector('.close-btn').onclick = () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    };

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after time based on urgency
    const autoRemoveTime = reminder.time <= 5 ? 30000 : // 30 seconds for urgent
                          reminder.time <= 15 ? 20000 : // 20 seconds for soon
                          15000; // 15 seconds for advance notice

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, autoRemoveTime);
  }

  playNotificationSound(minutesUntil) {
    try {
      // Create audio context for notification sounds
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      let frequency, duration;
      
      if (minutesUntil <= 5) {
        // Urgent: Higher frequency, longer duration
        frequency = 800;
        duration = 1000;
      } else if (minutesUntil <= 15) {
        // Soon: Medium frequency
        frequency = 600;
        duration = 500;
      } else {
        // Advance notice: Lower frequency, shorter duration
        frequency = 400;
        duration = 300;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Method to manually check for immediate calls (for testing)
  async checkNow() {
    await this.checkUpcomingCalls();
  }

  // Method to clear all notifications for a specific call
  clearCallNotifications(callId) {
    const keysToRemove = Array.from(this.notifiedCalls).filter(key => key.startsWith(`${callId}-`));
    keysToRemove.forEach(key => this.notifiedCalls.delete(key));
  }

  // Method to get notification statistics
  getStats() {
    return {
      isRunning: !!this.checkInterval,
      notifiedCalls: this.notifiedCalls.size,
      isInitialized: this.isInitialized
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
