import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatSADate } from '../../../utils/timeZone';
import { useToast } from '../../../contexts/ToastContext';
import { 
  Mail, 
  Send, 
  Reply, 
  Eye, 
  Clock, 
  User, 
  ExternalLink,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export default function CustomerEmailIntegration({ customerId, customerEmail, customerName }) {
  const toast = useToast();
  const [emailHistory, setEmailHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [showScheduleFollowup, setShowScheduleFollowup] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (customerId) {
      loadCustomerEmails();
      loadEmailTemplates();
      
      // Set up periodic email refresh to detect new emails
      const emailRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing emails for new messages...');
        loadCustomerEmails();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(emailRefreshInterval);
    }
  }, [customerId]);

  const loadCustomerEmails = async (showRefreshMessage = false) => {
    if (showRefreshMessage) {
      setRefreshing(true);
    }
    
    try {
      // First trigger IMAP sync to check for new emails
      if (window.electronAPI.invoke) {
        try {
          console.log('📧 Attempting IMAP sync...');
          const syncResult = await window.electronAPI.invoke('email-sync-imap');
          if (syncResult?.newEmails > 0) {
            console.log(`📧 IMAP sync found ${syncResult.newEmails} new emails`);
            if (showRefreshMessage) {
              toast.success(`Found ${syncResult.newEmails} new email(s)!`);
            }
          } else {
            console.log('📧 IMAP sync completed - no new emails');
          }
        } catch (syncError) {
          console.log('📧 IMAP sync not available:', syncError.message);
          // Try alternative sync method
          try {
            await window.electronAPI.invoke('email-fetch-latest');
            console.log('📧 Alternative email fetch attempted');
          } catch (altError) {
            console.log('📧 Alternative sync also failed:', altError.message);
          }
        }
      }
      
      // Also attempt to link any unlinked emails to this customer
      try {
        await window.electronAPI.query(`
          UPDATE email_messages 
          SET customer_id = $1
          WHERE customer_id IS NULL
          AND (
            from_email = $2 OR 
            to_emails::text LIKE $3
          )
        `, [customerId, customerEmail, `%${customerEmail}%`]);
        console.log('📧 Attempted to link unlinked emails');
      } catch (linkError) {
        console.log('📧 Email linking failed:', linkError.message);
      }
      
      const result = await window.electronAPI.query(`
        SELECT em.*, ea.email_address as account_email, ea.name as account_name
        FROM email_messages em
        LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
        WHERE em.customer_id = $1
        ORDER BY em.received_at DESC, em.sent_at DESC
        LIMIT 20
      `, [customerId]);
      
      if (result.success) {
        const newEmails = result.data;
        
        // Calculate unread count
        const newUnreadCount = newEmails.filter(email => 
          email.direction === 'inbound' && !email.is_read
        ).length;
        
        // Check for newly received emails since last load
        if (emailHistory.length > 0 && newEmails.length > emailHistory.length) {
          const newCount = newEmails.length - emailHistory.length;
          if (!showRefreshMessage) { // Only show auto-detection message
            toast.success(`${newCount} new email(s) received!`, {
              icon: '📧',
              duration: 4000
            });
          }
        }
        
        setEmailHistory(newEmails);
        setUnreadCount(newUnreadCount);
        
        if (showRefreshMessage) {
          if (newEmails.length > 0) {
            toast.success(`Refreshed! Found ${newEmails.length} emails (${newUnreadCount} unread)`);
          } else {
            toast.info('Email history refreshed');
          }
        }
      }
    } catch (error) {
      console.error('Error loading customer emails:', error);
      if (showRefreshMessage) {
        toast.error('Failed to refresh emails');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT * FROM email_templates 
        WHERE is_active = true 
        ORDER BY template_type, name
      `);
      
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  const scheduleFollowupEmail = async (templateId, daysFromNow) => {
    if (!templateId) {
      toast.warning('No template found for this follow-up type');
      return;
    }

    try {
      const result = await window.electronAPI.invoke('email-schedule-followup', {
        customerId: customerId,
        templateId: templateId,
        daysFromNow: daysFromNow,
        triggerData: {
          customer_name: customerName,
          inquiry_subject: 'your recent inquiry'
        },
        forceSchedule: false // Check customer preferences
      });

      if (result.success) {
        toast.success(`Follow-up email scheduled for ${daysFromNow} days from now!`);
        setShowScheduleFollowup(false);
      } else if (result.requiresConfirmation) {
        const confirmed = await toast.confirm(
          `${result.error}\n\nWould you like to schedule this follow-up anyway?`
        );
        
        if (confirmed) {
          // Retry with force flag
          const forceResult = await window.electronAPI.invoke('email-schedule-followup', {
            customerId: customerId,
            templateId: templateId,
            daysFromNow: daysFromNow,
            triggerData: {
              customer_name: customerName,
              inquiry_subject: 'your recent inquiry'
            },
            forceSchedule: true
          });
          
          if (forceResult.success) {
            toast.success(`Follow-up email scheduled for ${daysFromNow} days from now! (Manual override)`);
            setShowScheduleFollowup(false);
          } else {
            toast.error('Failed to schedule email: ' + forceResult.error);
          }
        }
      } else {
        toast.error('Failed to schedule email: ' + result.error);
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast.error('Error scheduling follow-up: ' + error.message);
    }
  };

  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setShowEmailViewer(true);
  };

  const handleReplyToEmail = (email) => {
    // Set up compose with reply data
    setShowCompose(true);
    // You could pass reply context here
  };

  if (!customerId) {
    return (
      <div className="bg-card rounded-lg p-4">
        <p className="text-muted-foreground text-center">Select a customer to view email history</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Email Communication Header - Moved Above Buttons */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Communication
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage email conversations with {customerName}
          </p>
        </div>

        {/* Customer Email Info */}
        {customerEmail && (
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Customer Email</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{customerEmail}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100">Email Actions</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Compose new emails or schedule follow-ups
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              <Send className="w-4 h-4" />
              <span className="font-medium">Compose</span>
            </button>
            <button
              onClick={() => setShowScheduleFollowup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Schedule</span>
            </button>
          </div>
        </div>

        {/* Quick Follow-up Actions */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Follow-ups</p>
          <div className="flex flex-wrap gap-2">
            {[
              { days: 3, label: '3-Day', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
              { days: 7, label: '7-Day', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
              { days: 14, label: '14-Day', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' }
            ].map(({ days, label, color }) => (
              <button
                key={days}
                onClick={() => scheduleFollowupEmail(
                  templates.find(t => t.name.includes(`${days}-Day`))?.id,
                  days
                )}
                disabled={!templates.find(t => t.name.includes(`${days}-Day`))}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {label} Follow-up
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-600" />
              Email History
              {emailHistory.length > 0 && (
                <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                  {emailHistory.length}
                </span>
              )}
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </h4>
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered...');
                loadCustomerEmails(true);
              }}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading email history...</p>
            </div>
          ) : emailHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No emails yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Start a conversation with this customer</p>
              <button
                onClick={() => setShowCompose(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send First Email
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {emailHistory.map((email, index) => (
                <EmailHistoryItem
                  key={email.id}
                  email={email}
                  index={index}
                  onView={() => handleViewEmail(email)}
                  onReply={() => handleReplyToEmail(email)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCompose && (
          <ComposeEmailModal
            customerEmail={customerEmail}
            customerName={customerName}
            templates={templates}
            onClose={() => setShowCompose(false)}
            onEmailSent={() => {
              setShowCompose(false);
              setTimeout(() => loadCustomerEmails(true), 1000); // Delay to allow email to be processed
            }}
          />
        )}

        {showScheduleFollowup && (
          <ScheduleFollowupModal
            customerId={customerId}
            customerName={customerName}
            templates={templates.filter(t => t.template_type === 'followup')}
            onClose={() => setShowScheduleFollowup(false)}
            onScheduled={() => {
              setShowScheduleFollowup(false);
              toast.success('Follow-up email scheduled successfully!');
            }}
          />
        )}

        {showEmailViewer && selectedEmail && (
          <EmailViewerModal
            email={selectedEmail}
            onClose={() => {
              setShowEmailViewer(false);
              setSelectedEmail(null);
            }}
            onReply={() => {
              setShowEmailViewer(false);
              handleReplyToEmail(selectedEmail);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compose Email Modal
function ComposeEmailModal({ customerEmail, customerName, templates, onClose, onEmailSent }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    to: customerEmail || '',
    subject: '',
    body: '',
    templateId: ''
  });
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    loadEmailAccounts();
  }, []);

  const loadEmailAccounts = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT id, name, email_address FROM email_accounts 
        WHERE is_active = true 
        ORDER BY is_default DESC, name
      `);
      
      if (result.success) {
        setAccounts(result.data);
        if (result.data.length > 0) {
          setSelectedAccount(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading email accounts:', error);
    }
  };

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) {
      setFormData({...formData, templateId: '', subject: '', body: ''});
      return;
    }

    try {
      const result = await window.electronAPI.query(`
        SELECT * FROM email_templates WHERE id = $1
      `, [templateId]);

      if (result.success && result.data[0]) {
        const template = result.data[0];
        
        // Get customer data for variable replacement
        let customerData = {};
        let recentProducts = '';
        let companyName = '';
        
        try {
          if (customerId) {
            const customerResult = await window.electronAPI.query(`
              SELECT c.*, 
                     (SELECT COUNT(*) FROM rfq_requests WHERE customer_phone = c.phone) as rfq_count
              FROM customers c WHERE c.id = $1
            `, [customerId]);
            
            if (customerResult.success && customerResult.data[0]) {
              customerData = customerResult.data[0];
              companyName = customerData.company || '';
              
              // Get recent products from RFQs
              const productsResult = await window.electronAPI.query(`
                SELECT DISTINCT p.product_name, p.quantity, r.created_at
                FROM rfq_requests r 
                JOIN rfq_products p ON r.id = p.rfq_id 
                WHERE r.customer_phone = $1 
                ORDER BY r.created_at DESC 
                LIMIT 5
              `, [customerData.phone]);
              
              if (productsResult.success && productsResult.data.length > 0) {
                recentProducts = productsResult.data.map(p => 
                  `${p.product_name} (Qty: ${p.quantity})`
                ).join(', ');
              }
            }
          }
        } catch (dataError) {
          console.log('Could not load customer data for template:', dataError.message);
        }

        // Prepare template variables
        const templateVars = {
          customer_name: customerData.name || customerName || 'Valued Customer',
          company_name: companyName || 'your company',
          sender_name: 'MCM Support Team',
          inquiry_subject: recentProducts ? `products: ${recentProducts}` : 'your recent inquiry',
          order_id: customerData.id ? `MCM-${customerData.id}-${Date.now().toString().slice(-4)}` : `MCM-${Date.now().toString().slice(-6)}`,
          product_list: recentProducts || 'the products you inquired about',
          total_amount: 'TBD',
          date: new Date().toLocaleDateString('en-ZA'),
          phone_number: customerData.phone || '',
          email_address: customerData.email || customerEmail || ''
        };

        // Replace variables in subject and body
        let processedSubject = template.subject;
        let processedBody = template.body_html || template.body_text;

        Object.keys(templateVars).forEach(key => {
          const placeholder = `{${key}}`;
          const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
          processedSubject = processedSubject.replace(regex, templateVars[key]);
          processedBody = processedBody.replace(regex, templateVars[key]);
        });

        console.log('🔧 Template variables applied:', templateVars);
        
        setFormData({
          ...formData,
          templateId,
          subject: processedSubject,
          body: processedBody
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Error loading template: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const result = await window.electronAPI.invoke('email-send', {
        accountId: selectedAccount,
        to: formData.to,
        subject: formData.subject,
        html: formData.body,
        text: formData.body.replace(/<[^>]*>/g, '') // Strip HTML for text version
      });

      if (result.success) {
        toast.success('Email sent successfully!');
        onEmailSent();
      } else {
        toast.error('Failed to send email: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Compose Email</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  From Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.email_address})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Use Template
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select template (optional)</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                To
              </label>
              <input
                type="email"
                required
                value={formData.to}
                onChange={(e) => setFormData({...formData, to: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Message
              </label>
              <textarea
                required
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={8}
                placeholder="Your email message..."
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !selectedAccount}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Schedule Follow-up Modal
function ScheduleFollowupModal({ customerId, customerName, templates, onClose, onScheduled }) {
  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [followupDays, setFollowupDays] = useState(3);
  const [scheduling, setScheduling] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setScheduling(true);

    try {
      const result = await window.electronAPI.invoke('email-schedule-followup', {
        customerId: customerId,
        templateId: selectedTemplate,
        daysFromNow: followupDays,
        triggerData: {
          customer_name: customerName,
          inquiry_subject: 'your recent inquiry'
        }
      });

      if (result.success) {
        toast.success('Follow-up email scheduled successfully!');
        onScheduled();
      } else {
        toast.error('Failed to schedule follow-up: ' + result.error);
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast.error('Error scheduling follow-up: ' + error.message);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Schedule Follow-up Email</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email Template
              </label>
              <select
                required
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select follow-up template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Send in how many days?
              </label>
              <select
                value={followupDays}
                onChange={(e) => setFollowupDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Customer:</strong> {customerName}<br/>
                <strong>Scheduled for:</strong> {new Date(Date.now() + followupDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scheduling || !selectedTemplate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {scheduling ? 'Scheduling...' : 'Schedule Follow-up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Enhanced Email History Item Component
function EmailHistoryItem({ email, index, onView, onReply }) {
  const getEmailIcon = (direction) => {
    return direction === 'inbound' ? (
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
    ) : (
      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>
    );
  };

  const getStatusBadge = (direction) => {
    return direction === 'inbound' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
        <ArrowLeft className="w-3 h-3" />
        Received
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        <ExternalLink className="w-3 h-3" />
        Sent
      </span>
    );
  };

  // Check if email is very recent (within last 30 minutes)
  const isVeryRecent = () => {
    const emailTime = new Date(email.received_at || email.sent_at);
    const now = new Date();
    const diffMinutes = (now - emailTime) / (1000 * 60);
    return diffMinutes < 30;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 ${
        !email.is_read && email.direction === 'inbound' ? 'ring-2 ring-blue-200 bg-blue-50 dark:bg-blue-950' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {getEmailIcon(email.direction)}
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(email.direction)}
              {!email.is_read && email.direction === 'inbound' && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Unread"></span>
              )}
              {isVeryRecent() && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatSADate(email.received_at || email.sent_at)}
            </span>
          </div>
          
          {/* Subject */}
          <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">
            {email.subject}
          </h5>
          
          {/* From/To Info */}
          <div className="space-y-1 mb-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {email.direction === 'inbound' 
                ? `From: ${email.from_email}` 
                : `To: ${email.to_emails?.join(', ')}`}
            </p>
            {email.account_name && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Via: {email.account_name}
              </p>
            )}
          </div>
          
          {/* Preview */}
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
            {email.body_text?.substring(0, 150)}...
          </p>
          
          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onView}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Eye className="w-3 h-3" />
              View
            </button>
            {email.direction === 'inbound' && (
              <button
                onClick={onReply}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Email Viewer Modal Component  
function EmailViewerModal({ email, onClose, onReply }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {email.subject}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {email.direction === 'inbound' 
                    ? `From: ${email.from_email}` 
                    : `To: ${email.to_emails?.join(', ')}`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatSADate(email.received_at || email.sent_at)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                  email.direction === 'inbound' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {email.direction === 'inbound' ? 'Received' : 'Sent'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div 
            className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{ 
              __html: email.body_html || email.body_text?.replace(/\n/g, '<br>') 
            }}
          />
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Close
            </button>
            {email.direction === 'inbound' && (
              <button
                onClick={onReply}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
