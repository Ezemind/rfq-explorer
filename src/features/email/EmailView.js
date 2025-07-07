import React, { useState, useEffect } from 'react';
import { formatSADate } from '../../utils/timeZone';
import { useToast } from '../../contexts/ToastContext';

export default function EmailView({ onClose, emailType = 'compose', emailId = null, customerId = null }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('compose');
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state for compose
  const [composeData, setComposeData] = useState({
    accountId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    bodyHtml: '',
    templateId: '',
    customerId: customerId || ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load email accounts
      const accountsResult = await window.electronAPI.query(`
        SELECT * FROM email_accounts WHERE is_active = true ORDER BY is_default DESC
      `);
      
      // Load email templates
      const templatesResult = await window.electronAPI.query(`
        SELECT * FROM email_templates WHERE is_active = true ORDER BY template_type, name
      `);

      if (accountsResult.success) {
        setEmailAccounts(accountsResult.data);
        if (accountsResult.data.length > 0) {
          setComposeData(prev => ({
            ...prev,
            accountId: accountsResult.data.find(a => a.is_default)?.id || accountsResult.data[0].id
          }));
        }
      }

      if (templatesResult.success) {
        setEmailTemplates(templatesResult.data);
      }

      // If viewing specific email, load it
      if (emailId) {
        const emailResult = await window.electronAPI.query(`
          SELECT em.*, ea.email_address as account_email, c.name as customer_name
          FROM email_messages em
          LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
          LEFT JOIN customers c ON em.customer_id = c.id
          WHERE em.id = $1
        `, [emailId]);
        
        if (emailResult.success && emailResult.data[0]) {
          setEmailData(emailResult.data[0]);
          setActiveTab('view');
        }
      }

      // Load customer data if provided
      if (customerId) {
        const customerResult = await window.electronAPI.query(`
          SELECT c.*, 
                 (SELECT COUNT(*) FROM rfq_requests WHERE customer_phone = c.phone) as rfq_count,
                 (SELECT string_agg(DISTINCT p.product_name, ', ') 
                  FROM rfq_requests r 
                  JOIN rfq_products p ON r.id = p.rfq_id 
                  WHERE r.customer_phone = c.phone 
                  LIMIT 5) as recent_products
          FROM customers c WHERE c.id = $1
        `, [customerId]);
        
        if (customerResult.success && customerResult.data[0]) {
          const customer = customerResult.data[0];
          setComposeData(prev => ({
            ...prev,
            to: customer.email || '',
            customerId: customer.id
          }));
          
          console.log('📧 Loaded customer data:', customer.name, 'with', customer.rfq_count, 'RFQs');
        }
      }

    } catch (error) {
      console.error('Error loading email data:', error);
      toast.error('Error loading email data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) {
      setComposeData(prev => ({ ...prev, templateId: '', subject: '', bodyHtml: '' }));
      return;
    }

    try {
      const template = emailTemplates.find(t => t.id == templateId);
      if (template) {
        // Get customer data for variable replacement
        let customerData = {};
        let recentProducts = '';
        if (composeData.customerId) {
          const customerResult = await window.electronAPI.query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM rfq_requests WHERE customer_phone = c.phone) as rfq_count
            FROM customers c WHERE c.id = $1
          `, [composeData.customerId]);
          
          if (customerResult.success && customerResult.data[0]) {
            customerData = customerResult.data[0];
            
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

        // Prepare template variables
        const templateVars = {
          customer_name: customerData.name || composeData.to.split('@')[0] || 'Valued Customer',
          company_name: customerData.company || '',
          sender_name: 'Support Team', // You can make this dynamic
          inquiry_subject: recentProducts ? `products: ${recentProducts}` : 'your recent inquiry',
          order_id: customerData.id ? `ORD-${customerData.id}` : '',
          product_list: recentProducts || 'your requested products',
          total_amount: 'TBD', // Could be calculated from RFQ
          date: new Date().toLocaleDateString('en-ZA'),
          phone_number: customerData.phone || '',
          email_address: customerData.email || composeData.to
        };

        // Replace variables in subject and body
        let processedSubject = template.subject;
        let processedBody = template.body_html || template.body_text;

        Object.keys(templateVars).forEach(key => {
          const placeholder = `{${key}}`;
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), templateVars[key]);
          processedBody = processedBody.replace(new RegExp(placeholder, 'g'), templateVars[key]);
        });

        setComposeData(prev => ({
          ...prev,
          templateId,
          subject: processedSubject,
          bodyHtml: processedBody
        }));
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    try {
      // Call the actual email sending IPC handler
      const result = await window.electronAPI.invoke('email-send', {
        accountId: composeData.accountId,
        to: composeData.to,
        cc: composeData.cc || undefined,
        bcc: composeData.bcc || undefined,
        subject: composeData.subject,
        html: composeData.bodyHtml,
        text: composeData.bodyHtml.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        attachments: [],
        customerId: composeData.customerId || null // Add customer ID for proper linking
      });

      if (result.success) {
        toast.success('Email sent successfully!');
        onClose();
      } else {
        toast.error('Failed to send email: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending email: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-foreground">
              {activeTab === 'compose' ? 'Compose Email' : emailData ? 'View Email' : 'Email'}
            </h1>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 border border-border rounded-lg">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2 text-sm transition-colors rounded-l-lg ${
                activeTab === 'compose' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Compose
            </button>
            {emailData && (
              <button
                onClick={() => setActiveTab('view')}
                className={`px-4 py-2 text-sm transition-colors rounded-r-lg ${
                  activeTab === 'view' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                View Email
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'compose' && (
          <ComposeEmailContent 
            composeData={composeData}
            setComposeData={setComposeData}
            emailAccounts={emailAccounts}
            emailTemplates={emailTemplates}
            onTemplateSelect={handleTemplateSelect}
            onSendEmail={handleSendEmail}
          />
        )}
        
        {activeTab === 'view' && emailData && (
          <ViewEmailContent emailData={emailData} />
        )}
      </div>
    </div>
  );
}

function ComposeEmailContent({ composeData, setComposeData, emailAccounts, emailTemplates, onTemplateSelect, onSendEmail }) {
  const [useTemplate, setUseTemplate] = useState(false);

  return (
    <div className="h-full flex">
      {/* Sidebar with templates and accounts */}
      <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Email Account Selection */}
          <div>
            <h3 className="font-medium text-foreground mb-3">From Account</h3>
            <select
              value={composeData.accountId}
              onChange={(e) => setComposeData(prev => ({ ...prev, accountId: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select account</option>
              {emailAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email_address})
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="useTemplate"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="useTemplate" className="font-medium text-foreground">
                Use Template
              </label>
            </div>
            
            {useTemplate && (
              <div className="space-y-2">
                <select
                  value={composeData.templateId}
                  onChange={(e) => onTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select template</option>
                  {emailTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                
                {/* Template Preview */}
                {composeData.templateId && (
                  <div className="mt-4">
                    <h4 className="font-medium text-foreground mb-2">Template Preview</h4>
                    <div className="max-h-32 overflow-y-auto border border-border rounded-md p-2 text-sm bg-muted/20">
                      {emailTemplates.find(t => t.id == composeData.templateId)?.body_text?.substring(0, 200)}...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main compose area */}
      <div className="flex-1 flex flex-col">
        <form onSubmit={onSendEmail} className="h-full flex flex-col">
          <div className="p-6 space-y-4">
            {/* To, CC, BCC */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">To *</label>
                <input
                  type="email"
                  required
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">CC</label>
                <input
                  type="email"
                  value={composeData.cc}
                  onChange={(e) => setComposeData(prev => ({ ...prev, cc: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="cc@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">BCC</label>
                <input
                  type="email"
                  value={composeData.bcc}
                  onChange={(e) => setComposeData(prev => ({ ...prev, bcc: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Subject *</label>
              <input
                type="text"
                required
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Email subject"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="flex-1 p-6 pt-0">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Message *</label>
            <textarea
              required
              value={composeData.bodyHtml}
              onChange={(e) => setComposeData(prev => ({ ...prev, bodyHtml: e.target.value }))}
              className="w-full h-full min-h-96 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Your email message..."
            />
          </div>

          {/* Actions */}
          <div className="border-t border-border p-4 flex justify-end space-x-3">
            <button
              type="button"
              className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewEmailContent({ emailData }) {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Email Header */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">{emailData.subject}</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">From:</span>
              <p className="text-foreground font-medium">{emailData.from_email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="text-foreground">{formatSADate(emailData.received_at || emailData.sent_at)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">To:</span>
              <p className="text-foreground">{emailData.to_emails?.join(', ')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Direction:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                emailData.direction === 'inbound' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {emailData.direction}
              </span>
            </div>
          </div>

          {emailData.customer_name && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-muted-foreground">Customer:</span>
              <p className="text-foreground font-medium">{emailData.customer_name}</p>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div 
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: emailData.body_html || emailData.body_text }}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex space-x-3">
          {emailData.direction === 'inbound' && (
            <>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Reply
              </button>
              <button className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors">
                Forward
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}