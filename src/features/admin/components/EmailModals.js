import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';

export function AddEmailAccountModal({ onClose, onAccountAdded }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    emailAddress: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Note: In production, passwords should be encrypted
      const result = await window.electronAPI.query(`
        INSERT INTO email_accounts (
          name, email_address, smtp_host, smtp_port, smtp_username, smtp_password,
          imap_host, imap_port, imap_username, imap_password, is_default, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 1)
      `, [
        formData.name,
        formData.emailAddress,
        formData.smtpHost,
        formData.smtpPort,
        formData.smtpUsername,
        formData.smtpPassword, // Should be encrypted in production
        formData.imapHost,
        formData.imapPort,
        formData.imapUsername,
        formData.imapPassword, // Should be encrypted in production
        formData.isDefault
      ]);

      if (result.success) {
        // If this is set as default, update other accounts
        if (formData.isDefault) {
          await window.electronAPI.query(`
            UPDATE email_accounts SET is_default = false 
            WHERE email_address != $1
          `, [formData.emailAddress]);
        }
        toast.success('Email account created successfully!');
        onAccountAdded();
      } else {
        toast.error('Failed to create email account: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating email account:', error);
      toast.error('Error creating email account: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      // In a real implementation, you would test the SMTP/IMAP connection here
      // For now, we'll simulate a successful test
      setTimeout(() => {
        toast.success('Connection test successful! (Note: This is a simulated test)');
        setTestingConnection(false);
      }, 2000);
    } catch (error) {
      toast.error('Connection test failed: ' + error.message);
      setTestingConnection(false);
    }
  };

  const presetConfigs = {
    gmail: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      imapHost: 'imap.gmail.com',
      imapPort: 993
    },
    outlook: {
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      imapHost: 'outlook.office365.com',
      imapPort: 993
    },
    yahoo: {
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 587,
      imapHost: 'imap.mail.yahoo.com',
      imapPort: 993
    }
  };

  const applyPreset = (preset) => {
    setFormData({
      ...formData,
      ...presetConfigs[preset]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add Email Account</h3>
          
          {/* Quick presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Quick Setup (Optional)
            </label>
            <div className="flex space-x-2">
              {Object.keys(presetConfigs).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground hover:bg-muted/80 rounded transition-colors capitalize"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Primary Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.emailAddress}
                  onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your.email@domain.com"
                />
              </div>
            </div>
            
            {/* SMTP Settings */}
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">SMTP Settings (Outgoing Mail)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    SMTP Server *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.smtpHost}
                    onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="smtp.domain.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({...formData, smtpPort: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.smtpUsername}
                    onChange={(e) => setFormData({...formData, smtpUsername: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Usually your email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData({...formData, smtpPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="App password if using 2FA"
                  />
                </div>
              </div>
            </div>

            {/* IMAP Settings */}
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">IMAP Settings (Incoming Mail)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    IMAP Server *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.imapHost}
                    onChange={(e) => setFormData({...formData, imapHost: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="imap.domain.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.imapPort}
                    onChange={(e) => setFormData({...formData, imapPort: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.imapUsername}
                    onChange={(e) => setFormData({...formData, imapUsername: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Usually your email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.imapPassword}
                    onChange={(e) => setFormData({...formData, imapPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="App password if using 2FA"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isDefault" className="text-sm text-foreground">
                Set as default email account
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={testConnection}
                disabled={testingConnection || !formData.smtpHost || !formData.imapHost}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AddEmailTemplateModal({ onClose, onTemplateAdded }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    templateType: 'general',
    variables: []
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('html');

  const templateTypes = [
    { value: 'general', label: 'General' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'rfq_response', label: 'RFQ Response' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'reminder', label: 'Reminder' }
  ];

  const commonVariables = [
    '{customer_name}',
    '{company_name}',
    '{sender_name}',
    '{inquiry_subject}',
    '{order_id}',
    '{product_list}',
    '{total_amount}',
    '{date}',
    '{phone_number}',
    '{email_address}'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await window.electronAPI.query(`
        INSERT INTO email_templates (
          name, subject, body_html, body_text, template_type, variables, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, 1)
      `, [
        formData.name,
        formData.subject,
        formData.bodyHtml,
        formData.bodyText,
        formData.templateType,
        JSON.stringify(formData.variables)
      ]);

      if (result.success) {
        toast.success('Email template created successfully!');
        onTemplateAdded();
      } else {
        toast.error('Failed to create template: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Error creating template: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable) => {
    if (previewMode === 'html') {
      setFormData({
        ...formData,
        bodyHtml: formData.bodyHtml + variable
      });
    } else {
      setFormData({
        ...formData,
        bodyText: formData.bodyText + variable
      });
    }

    // Add to variables list if not already there
    if (!formData.variables.includes(variable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variable]
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Create Email Template</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 3-Day Follow-up"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Template Type
                </label>
                <select
                  value={formData.templateType}
                  onChange={(e) => setFormData({...formData, templateType: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {templateTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Following up on your inquiry - {customer_name}"
              />
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Available Variables
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                {commonVariables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Content */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email Content *
                </label>
                <div className="flex border border-border rounded-md">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('html')}
                    className={`px-3 py-1 text-xs rounded-l-md transition-colors ${
                      previewMode === 'html' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('text')}
                    className={`px-3 py-1 text-xs rounded-r-md transition-colors ${
                      previewMode === 'text' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              </div>
              
              {previewMode === 'html' ? (
                <textarea
                  value={formData.bodyHtml}
                  onChange={(e) => setFormData({...formData, bodyHtml: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={8}
                  placeholder="<p>Hello {customer_name},</p><p>Thank you for your inquiry...</p>"
                />
              ) : (
                <textarea
                  value={formData.bodyText}
                  onChange={(e) => setFormData({...formData, bodyText: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={8}
                  placeholder="Hello {customer_name},\n\nThank you for your inquiry..."
                />
              )}
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
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ComposeEmailModal({ accounts, templates, onClose, onEmailSent }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    accountId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    bodyHtml: '',
    templateId: '',
    customerId: ''
  });
  const [sending, setSending] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) {
      setFormData({...formData, templateId: '', subject: '', bodyHtml: ''});
      return;
    }

    try {
      const result = await window.electronAPI.query(`
        SELECT * FROM email_templates WHERE id = $1
      `, [templateId]);

      if (result.success && result.data[0]) {
        const template = result.data[0];
        setFormData({
          ...formData,
          templateId,
          subject: template.subject,
          bodyHtml: template.body_html
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // Call the actual email sending IPC handler
      const result = await window.electronAPI.invoke('email-send', {
        accountId: formData.accountId,
        to: formData.to,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        subject: formData.subject,
        html: formData.bodyHtml,
        text: formData.bodyHtml.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        attachments: []
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
      <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Compose Email</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  From Account *
                </label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select email account</option>
                  {accounts.filter(a => a.is_active).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.email_address})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-muted-foreground mb-2">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Use Template</span>
                </label>
                {useTemplate && (
                  <select
                    value={formData.templateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                To *
              </label>
              <input
                type="email"
                required
                value={formData.to}
                onChange={(e) => setFormData({...formData, to: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="recipient@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  CC
                </label>
                <input
                  type="email"
                  value={formData.cc}
                  onChange={(e) => setFormData({...formData, cc: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="cc@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  BCC
                </label>
                <input
                  type="email"
                  value={formData.bcc}
                  onChange={(e) => setFormData({...formData, bcc: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Email subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Message *
              </label>
              <textarea
                required
                value={formData.bodyHtml}
                onChange={(e) => setFormData({...formData, bodyHtml: e.target.value})}
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
                disabled={sending}
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

export function EditEmailTemplateModal({ template, onClose, onTemplateUpdated }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: template.name || '',
    subject: template.subject || '',
    bodyHtml: template.body_html || '',
    bodyText: template.body_text || '',
    templateType: template.template_type || 'general',
    variables: Array.isArray(template.variables) ? template.variables : JSON.parse(template.variables || '[]')
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('html');

  const templateTypes = [
    { value: 'general', label: 'General' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'rfq_response', label: 'RFQ Response' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'reminder', label: 'Reminder' }
  ];

  const commonVariables = [
    '{customer_name}',
    '{company_name}',
    '{sender_name}',
    '{inquiry_subject}',
    '{order_id}',
    '{product_list}',
    '{total_amount}',
    '{date}',
    '{phone_number}',
    '{email_address}'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await window.electronAPI.query(`
        UPDATE email_templates SET
          name = $1,
          subject = $2,
          body_html = $3,
          body_text = $4,
          template_type = $5,
          variables = $6,
          updated_at = NOW(),
          updated_by = 1
        WHERE id = $7
      `, [
        formData.name,
        formData.subject,
        formData.bodyHtml,
        formData.bodyText,
        formData.templateType,
        JSON.stringify(formData.variables),
        template.id
      ]);

      if (result.success) {
        toast.success('Email template updated successfully!');
        onTemplateUpdated();
      } else {
        toast.error('Failed to update template: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Error updating template: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Edit Email Template</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Template Type
                </label>
                <select
                  value={formData.templateType}
                  onChange={(e) => setFormData({...formData, templateType: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {templateTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Subject Line *
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email Content *
                </label>
                <div className="flex border border-border rounded-md">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('html')}
                    className={`px-3 py-1 text-xs rounded-l-md transition-colors ${
                      previewMode === 'html' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('text')}
                    className={`px-3 py-1 text-xs rounded-r-md transition-colors ${
                      previewMode === 'text' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              </div>
              
              {previewMode === 'html' ? (
                <textarea
                  value={formData.bodyHtml}
                  onChange={(e) => setFormData({...formData, bodyHtml: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={8}
                />
              ) : (
                <textarea
                  value={formData.bodyText}
                  onChange={(e) => setFormData({...formData, bodyText: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={8}
                />
              )}
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
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Updating...' : 'Update Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
