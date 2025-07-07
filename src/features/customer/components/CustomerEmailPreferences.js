import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import InlineNotification from '../../../components/ui/InlineNotification';

export default function CustomerEmailPreferences({ customerId, customerName, onPreferencesUpdated }) {
  const toast = useToast();
  const [preferences, setPreferences] = useState({
    auto_followups_enabled: false,
    marketing_emails_enabled: true,
    rfq_notifications_enabled: true,
    followup_frequency: 'standard',
    preferred_email: '',
    unsubscribed: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (customerId) {
      loadCustomerPreferences();
    }
  }, [customerId]);

  const loadCustomerPreferences = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT cep.*, c.email as customer_email
        FROM customer_email_preferences cep
        RIGHT JOIN customers c ON cep.customer_id = c.id
        WHERE c.id = $1
      `, [customerId]);
      
      if (result.success && result.data[0]) {
        const data = result.data[0];
        setPreferences({
          auto_followups_enabled: data.auto_followups_enabled || false,
          marketing_emails_enabled: data.marketing_emails_enabled !== false,
          rfq_notifications_enabled: data.rfq_notifications_enabled !== false,
          followup_frequency: data.followup_frequency || 'standard',
          preferred_email: data.preferred_email || data.customer_email || '',
          unsubscribed: data.unsubscribed || false
        });
      }
    } catch (error) {
      console.error('Error loading customer email preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setNotification(null);
    
    try {
      const result = await window.electronAPI.query(`
        INSERT INTO customer_email_preferences (
          customer_id, auto_followups_enabled, marketing_emails_enabled, 
          rfq_notifications_enabled, followup_frequency, preferred_email, 
          unsubscribed, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (customer_id) 
        DO UPDATE SET 
          auto_followups_enabled = $2,
          marketing_emails_enabled = $3,
          rfq_notifications_enabled = $4,
          followup_frequency = $5,
          preferred_email = $6,
          unsubscribed = $7,
          updated_at = NOW()
      `, [
        customerId,
        preferences.auto_followups_enabled,
        preferences.marketing_emails_enabled,
        preferences.rfq_notifications_enabled,
        preferences.followup_frequency,
        preferences.preferred_email,
        preferences.unsubscribed
      ]);

      if (result.success) {
        toast.success('Email preferences saved successfully!');
        setNotification({
          type: 'success',
          message: 'Preferences saved and will take effect immediately'
        });
        
        if (onPreferencesUpdated) {
          onPreferencesUpdated(preferences);
        }
      } else {
        toast.error('Failed to save preferences: ' + result.error);
        setNotification({
          type: 'error',
          message: 'Failed to save preferences. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast.error('Error saving preferences: ' + error.message);
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading email preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Email Preferences</h3>
          <p className="text-sm text-muted-foreground">Manage {customerName}'s email communication settings</p>
        </div>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Inline notification */}
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Auto Follow-ups Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <h4 className="font-medium text-foreground">🤖 Auto Follow-ups</h4>
            <p className="text-sm text-muted-foreground">
              Automatically send follow-up emails based on RFQ submissions and interactions
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.auto_followups_enabled}
              onChange={(e) => updatePreference('auto_followups_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Follow-up Frequency */}
        {preferences.auto_followups_enabled && (
          <div className="ml-4 p-3 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Follow-up Frequency
            </label>
            <select
              value={preferences.followup_frequency}
              onChange={(e) => updatePreference('followup_frequency', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="light">Light (7, 21 days)</option>
              <option value="standard">Standard (3, 7, 14 days)</option>
              <option value="aggressive">Aggressive (1, 3, 7, 14 days)</option>
            </select>
          </div>
        )}

        {/* RFQ Notifications */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <h4 className="font-medium text-foreground">📋 RFQ Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Send email notifications when RFQ quotes are ready
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.rfq_notifications_enabled}
              onChange={(e) => updatePreference('rfq_notifications_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Marketing Emails */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <h4 className="font-medium text-foreground">📧 Marketing Emails</h4>
            <p className="text-sm text-muted-foreground">
              Send promotional and marketing communications
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketing_emails_enabled}
              onChange={(e) => updatePreference('marketing_emails_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Preferred Email */}
        <div className="p-3 bg-muted rounded-lg">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            📬 Preferred Email Address
          </label>
          <input
            type="email"
            value={preferences.preferred_email}
            onChange={(e) => updatePreference('preferred_email', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="customer@example.com"
          />
          <p className="text-xs text-muted-foreground mt-1">
            If different from main customer email
          </p>
        </div>

        {/* Unsubscribe */}
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div>
            <h4 className="font-medium text-red-800">🚫 Unsubscribe from All Emails</h4>
            <p className="text-sm text-red-600">
              Customer will not receive any automated emails
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.unsubscribed}
              onChange={(e) => updatePreference('unsubscribed', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Warning if unsubscribed */}
        {preferences.unsubscribed && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ This customer is unsubscribed and will not receive any automated emails.
              Manual emails can still be sent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
