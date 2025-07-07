import React, { useState, useEffect } from 'react';
import { formatSADate } from '../../../utils/timeZone';
import { AddEmailAccountModal, AddEmailTemplateModal, ComposeEmailModal, EditEmailTemplateModal } from './EmailModals';
import EmailView from '../../email/EmailView';

export default function EmailManagement() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailMessages, setEmailMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showEmailView, setShowEmailView] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadEmailData();
  }, [activeTab]);

  const loadEmailData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'accounts') {
        await loadEmailAccounts();
      } else if (activeTab === 'templates') {
        await loadEmailTemplates();
      } else if (activeTab === 'inbox') {
        await loadEmailMessages();
      }
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailAccounts = async () => {
    const result = await window.electronAPI.query(`
      SELECT ea.*, su.username as created_by_username
      FROM email_accounts ea
      LEFT JOIN staff_users su ON ea.created_by = su.id
      ORDER BY ea.is_default DESC, ea.created_at DESC
    `);
    
    if (result.success) {
      setEmailAccounts(result.data);
    }
  };

  const loadEmailTemplates = async () => {
    const result = await window.electronAPI.query(`
      SELECT et.*, su.username as created_by_username
      FROM email_templates et
      LEFT JOIN staff_users su ON et.created_by = su.id
      WHERE et.is_active = true
      ORDER BY et.template_type, et.name
    `);
    
    if (result.success) {
      setEmailTemplates(result.data);
    }
  };

  const loadEmailMessages = async () => {
    const result = await window.electronAPI.query(`
      SELECT em.*, ea.email_address as account_email, c.name as customer_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      LEFT JOIN customers c ON em.customer_id = c.id
      ORDER BY em.received_at DESC, em.sent_at DESC
      LIMIT 50
    `);
    
    if (result.success) {
      setEmailMessages(result.data);
    }
  };

  const toggleAccountStatus = async (accountId, currentStatus) => {
    try {
      const result = await window.electronAPI.query(`
        UPDATE email_accounts 
        SET is_active = $1, updated_at = NOW() 
        WHERE id = $2
      `, [!currentStatus, accountId]);
      
      if (result.success) {
        loadEmailAccounts();
      }
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  };

  const setDefaultAccount = async (accountId) => {
    try {
      // First, remove default from all accounts
      await window.electronAPI.query(`
        UPDATE email_accounts SET is_default = false
      `);
      
      // Then set the selected account as default
      const result = await window.electronAPI.query(`
        UPDATE email_accounts 
        SET is_default = true, updated_at = NOW() 
        WHERE id = $1
      `, [accountId]);
      
      if (result.success) {
        loadEmailAccounts();
      }
    } catch (error) {
      console.error('Error setting default account:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Email Management</h3>
          <p className="text-sm text-muted-foreground">Manage email accounts, templates, and messages</p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'accounts' && (
            <button
              onClick={() => setShowAddAccount(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Email Account
            </button>
          )}
          {activeTab === 'templates' && (
            <button
              onClick={() => setShowAddTemplate(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Template
            </button>
          )}
          {activeTab === 'inbox' && (
            <button
              onClick={() => setShowEmailView(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Compose Email
            </button>
          )}
        </div>
      </div>

      {/* Email Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Email Tabs">
          {[
            { id: 'accounts', name: 'Email Accounts', icon: '📧' },
            { id: 'templates', name: 'Templates', icon: '📝' },
            { id: 'inbox', name: 'Messages', icon: '📨' },
            { id: 'automation', name: 'Automation', icon: '⚡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'accounts' && (
              <EmailAccountsList 
                accounts={emailAccounts}
                onToggleStatus={toggleAccountStatus}
                onSetDefault={setDefaultAccount}
                onRefresh={loadEmailAccounts}
              />
            )}
            {activeTab === 'templates' && (
              <EmailTemplatesList 
                templates={emailTemplates}
                onRefresh={loadEmailTemplates}
                onOpenEmailView={(templateId) => {
                  setSelectedEmailId(null);
                  setShowEmailView(true);
                }}
                onEditTemplate={(template) => {
                  setSelectedTemplate(template);
                  setShowEditTemplate(true);
                }}
              />
            )}
            {activeTab === 'inbox' && (
              <EmailMessagesList 
                messages={emailMessages}
                onRefresh={loadEmailMessages}
                onOpenEmailView={(emailId, customerId) => {
                  setSelectedEmailId(emailId);
                  setShowEmailView(true);
                }}
              />
            )}
            {activeTab === 'automation' && (
              <EmailAutomation />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddAccount && (
        <AddEmailAccountModal 
          onClose={() => setShowAddAccount(false)}
          onAccountAdded={() => {
            setShowAddAccount(false);
            loadEmailAccounts();
          }}
        />
      )}
      
      {showAddTemplate && (
        <AddEmailTemplateModal 
          onClose={() => setShowAddTemplate(false)}
          onTemplateAdded={() => {
            setShowAddTemplate(false);
            loadEmailTemplates();
          }}
        />
      )}

      {showCompose && (
        <ComposeEmailModal 
          accounts={emailAccounts}
          templates={emailTemplates}
          onClose={() => setShowCompose(false)}
          onEmailSent={() => {
            setShowCompose(false);
            loadEmailMessages();
          }}
        />
      )}

      {showEditTemplate && selectedTemplate && (
        <EditEmailTemplateModal 
          template={selectedTemplate}
          onClose={() => {
            setShowEditTemplate(false);
            setSelectedTemplate(null);
          }}
          onTemplateUpdated={() => {
            setShowEditTemplate(false);
            setSelectedTemplate(null);
            loadEmailTemplates();
          }}
        />
      )}

      {/* Full-screen Email View */}
      {showEmailView && (
        <EmailView
          emailId={selectedEmailId}
          onClose={() => {
            setShowEmailView(false);
            setSelectedEmailId(null);
            loadEmailData(); // Refresh data when view is closed
          }}
        />
      )}
    </div>
  );
}

// Email Accounts List Component
function EmailAccountsList({ accounts, onToggleStatus, onSetDefault, onRefresh }) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📧</div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Email Accounts</h3>
        <p className="text-muted-foreground">Add your first email account to start managing emails.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <div key={account.id} className="border border-border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {account.email_address.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground flex items-center space-x-2">
                    <span>{account.name}</span>
                    {account.is_default && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Default
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">{account.email_address}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">SMTP Server:</span>
                  <p className="text-foreground">{account.smtp_host}:{account.smtp_port}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">IMAP Server:</span>
                  <p className="text-foreground">{account.imap_host}:{account.imap_port}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="text-foreground">{formatSADate(account.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created By:</span>
                  <p className="text-foreground">{account.created_by_username || 'Unknown'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                account.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {account.is_active ? 'Active' : 'Inactive'}
              </span>
              
              {!account.is_default && account.is_active && (
                <button
                  onClick={() => onSetDefault(account.id)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors"
                >
                  Set Default
                </button>
              )}
              
              <button
                onClick={() => onToggleStatus(account.id, account.is_active)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  account.is_active
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {account.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
// Email Templates List Component  
function EmailTemplatesList({ templates, onRefresh, onOpenEmailView, onEditTemplate }) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Email Templates</h3>
        <p className="text-muted-foreground">Create your first email template to get started.</p>
      </div>
    );
  }

  const templateTypeColors = {
    'general': 'bg-gray-100 text-gray-800',
    'followup': 'bg-blue-100 text-blue-800',
    'rfq_response': 'bg-green-100 text-green-800',
    'welcome': 'bg-purple-100 text-purple-800',
    'reminder': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div key={template.id} className="border border-border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-medium text-foreground">{template.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  templateTypeColors[template.template_type] || templateTypeColors.general
                }`}>
                  {template.template_type ? template.template_type.replace(/_/g, ' ') : 'general'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Subject:</strong> {template.subject}
              </p>
              <p className="text-sm text-muted-foreground" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {template.body_text?.substring(0, 150)}...
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onOpenEmailView(template.id)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors"
              >
                Use Template
              </button>
              <button 
                onClick={() => {
                  const templatePreview = {
                    ...template,
                    variables: Array.isArray(template.variables) ? template.variables : JSON.parse(template.variables || '[]')
                  };
                  console.log('Template preview:', templatePreview);
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              >
                Preview
              </button>
              <button 
                onClick={() => onEditTemplate(template)}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 hover:bg-green-200 rounded-md transition-colors"
              >
                Edit
              </button>
              <button className="px-3 py-1 text-xs bg-red-100 text-red-800 hover:bg-red-200 rounded-md transition-colors">
                Disable
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm border-t border-border pt-3">
            <div>
              <span className="text-muted-foreground">Variables:</span>
              <p className="text-foreground">
                {template.variables ? (Array.isArray(template.variables) ? template.variables.length : JSON.parse(template.variables || '[]').length) : 0} variables
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="text-foreground">{formatSADate(template.created_at)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <p className="text-foreground">{formatSADate(template.updated_at)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Email Messages List Component
function EmailMessagesList({ messages, onRefresh, onOpenEmailView }) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📨</div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Email Messages</h3>
        <p className="text-muted-foreground">Your email messages will appear here once you set up an account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div key={message.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  message.direction === 'inbound' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    message.direction === 'inbound' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {message.direction}
                  </span>
                  {!message.is_read && message.direction === 'inbound' && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {message.direction === 'inbound' ? `From: ${message.from_email}` : `To: ${message.to_emails?.join(', ')}`}
                </p>
                <p className="text-sm font-medium text-foreground">{message.subject}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {message.body_text?.substring(0, 120)}...
                </p>
                {message.customer_name && (
                  <p className="text-xs text-muted-foreground">
                    Customer: {message.customer_name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {formatSADate(message.received_at || message.sent_at)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <button 
                  onClick={() => onOpenEmailView(message.id)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded transition-colors"
                >
                  View
                </button>
                {message.direction === 'inbound' && (
                  <button 
                    onClick={() => onOpenEmailView(null, message.customer_id)}
                    className="px-2 py-1 text-xs bg-green-100 text-green-800 hover:bg-green-200 rounded transition-colors"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Email Automation Component
function EmailAutomation() {
  const [automationRules, setAutomationRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomationRules();
  }, []);

  const loadAutomationRules = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT ear.*, su.username as created_by_username
        FROM email_automation_rules ear
        LEFT JOIN staff_users su ON ear.created_by = su.id
        ORDER BY ear.created_at DESC
      `);
      
      if (result.success) {
        setAutomationRules(result.data);
      }
    } catch (error) {
      console.error('Error loading automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading automation rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-foreground">Email Automation Rules</h4>
          <p className="text-sm text-muted-foreground">Set up automatic email workflows based on customer actions</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Create Rule
        </button>
      </div>

      {automationRules.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Automation Rules</h3>
          <p className="text-muted-foreground">Create your first automation rule to streamline your email workflows.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sample automation rules */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium text-foreground">3-Day Follow-up</h5>
                <p className="text-sm text-muted-foreground">Send follow-up email 3 days after RFQ submission</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors">
                  Edit
                </button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Trigger:</strong> 3 days after RFQ submission</p>
              <p><strong>Action:</strong> Send "3-Day Follow-up" template</p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium text-foreground">Welcome Email</h5>
                <p className="text-sm text-muted-foreground">Send welcome email when new customer is created</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors">
                  Edit
                </button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Trigger:</strong> New customer registration</p>
              <p><strong>Action:</strong> Send "Welcome" template immediately</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
