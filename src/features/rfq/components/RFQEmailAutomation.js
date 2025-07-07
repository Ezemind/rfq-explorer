import React, { useState, useEffect } from 'react';
import { formatSADate } from '../../../utils/timeZone';
import { useToast } from '../../../contexts/ToastContext';

export default function RFQEmailAutomation({ rfqId, customerId }) {
  const toast = useToast();
  const [rfqData, setRfqData] = useState(null);
  const [products, setProducts] = useState([]);
  const [detectedProducts, setDetectedProducts] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showSendQuote, setShowSendQuote] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rfqId) {
      loadRFQData();
      loadEmailTemplates();
    }
  }, [rfqId]);

  const loadRFQData = async () => {
    try {
      // Load RFQ details
      const rfqResult = await window.electronAPI.query(`
        SELECT r.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
        FROM rfq_requests r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.id = $1
      `, [rfqId]);

      if (rfqResult.success && rfqResult.data[0]) {
        setRfqData(rfqResult.data[0]);
      }

      // Load RFQ products
      const productsResult = await window.electronAPI.query(`
        SELECT * FROM rfq_products WHERE rfq_request_id = $1 ORDER BY id
      `, [rfqId]);

      if (productsResult.success) {
        setProducts(productsResult.data);
      }

      // Load detected products from emails
      const detectedResult = await window.electronAPI.query(`
        SELECT epm.*, em.subject, em.from_email, em.received_at
        FROM email_product_mentions epm
        JOIN email_messages em ON epm.email_message_id = em.id
        JOIN email_rfq_links erl ON em.id = erl.email_message_id
        WHERE erl.rfq_request_id = $1
        ORDER BY epm.confidence_score DESC
      `, [rfqId]);

      if (detectedResult.success) {
        setDetectedProducts(detectedResult.data);
      }

    } catch (error) {
      console.error('Error loading RFQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT * FROM email_templates 
        WHERE template_type IN ('rfq_response', 'general') AND is_active = true
        ORDER BY template_type, name
      `);
      
      if (result.success) {
        setEmailTemplates(result.data);
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  const addDetectedProductToRFQ = async (detectedProduct) => {
    try {
      const result = await window.electronAPI.query(`
        INSERT INTO rfq_products (rfq_request_id, product_name, quantity, price_quoted, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        rfqId,
        detectedProduct.product_name,
        detectedProduct.quantity,
        detectedProduct.price,
        `Auto-detected from email with ${(detectedProduct.confidence_score * 100).toFixed(0)}% confidence`
      ]);

      if (result.success) {
        // Mark as verified
        await window.electronAPI.query(`
          UPDATE email_product_mentions SET verified = true WHERE id = $1
        `, [detectedProduct.id]);

        // Reload data
        loadRFQData();
        toast.success('Product added to RFQ successfully!');
      }
    } catch (error) {
      console.error('Error adding detected product:', error);
      toast.error('Error adding product: ' + error.message);
    }
  };

  const generateQuoteEmail = () => {
    if (!rfqData || products.length === 0) {
      toast.warning('No products available to quote');
      return null;
    }

    const productList = products.map(p => 
      `<li>${p.product_name} - Qty: ${p.quantity} - Price: $${p.price_quoted || '0.00'}</li>`
    ).join('');

    const totalAmount = products.reduce((sum, p) => sum + ((p.price_quoted || 0) * p.quantity), 0);

    return {
      customer_name: rfqData.customer_name,
      order_id: `RFQ-${rfqId}`,
      product_list: `<ul>${productList}</ul>`,
      total_amount: `$${totalAmount.toFixed(2)}`,
      sender_name: 'Bob Explorer Team'
    };
  };

  const scheduleAutomaticFollowups = async () => {
    try {
      const result = await window.electronAPI.invoke('email-auto-schedule-rfq-followups', {
        rfqId: rfqId,
        customerId: customerId
      });

      if (result.success) {
        toast.success(`Scheduled ${result.scheduledCount} follow-up emails for this RFQ! (${result.frequency} frequency)`);
      } else if (result.requiresSetup) {
        const setup = await toast.confirm(
          `${result.error}\n\nWould you like to enable auto follow-ups for this customer?`
        );
        
        if (setup) {
          // Open customer preferences or enable directly
          toast.info('Please enable auto follow-ups in the customer preferences section.');
        }
      } else {
        toast.warning('Cannot schedule follow-ups: ' + result.error);
        if (result.customerPreferences) {
          console.log('Customer preferences:', result.customerPreferences);
        }
      }
    } catch (error) {
      console.error('Error scheduling follow-ups:', error);
      toast.error('Error scheduling follow-ups: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading RFQ data...</p>
        </div>
      </div>
    );
  }

  if (!rfqData) {
    return (
      <div className="bg-card rounded-lg p-4">
        <p className="text-muted-foreground text-center">RFQ not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* RFQ Overview */}
      <div className="bg-card rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-foreground">RFQ #{rfqId} - Email Automation</h3>
            <p className="text-sm text-muted-foreground">
              {rfqData.customer_name} • {rfqData.customer_email} • {formatSADate(rfqData.created_at)}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const quoteData = generateQuoteEmail();
                if (quoteData) {
                  setShowSendQuote(true);
                }
              }}
              disabled={products.length === 0}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              📧 Send Quote
            </button>
            <button
              onClick={scheduleAutomaticFollowups}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              📅 Auto Follow-ups
            </button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Subject:</strong> {rfqData.subject}</p>
          <p><strong>Message:</strong> {rfqData.message?.substring(0, 200)}...</p>
        </div>
      </div>

      {/* Current Products */}
      <div className="bg-card rounded-lg p-4">
        <h4 className="font-semibold text-foreground mb-3">RFQ Products ({products.length})</h4>
        
        {products.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-muted-foreground">No products added yet</p>
            <p className="text-sm text-muted-foreground">Products will appear here as they are detected from emails</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex justify-between items-center p-3 bg-muted rounded">
                <div>
                  <p className="font-medium text-foreground">{product.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {product.quantity} • Price: ${product.price_quoted || '0.00'}
                  </p>
                  {product.notes && (
                    <p className="text-xs text-muted-foreground">{product.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ${((product.price_quoted || 0) * product.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total:</span>
                <span>${products.reduce((sum, p) => sum + ((p.price_quoted || 0) * p.quantity), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI-Detected Products */}
      {detectedProducts.length > 0 && (
        <div className="bg-card rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-3">
            🤖 AI-Detected Products from Emails ({detectedProducts.length})
          </h4>
          
          <div className="space-y-3">
            {detectedProducts.map((detected) => (
              <div key={detected.id} className="border border-border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{detected.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {detected.quantity} • Price: ${detected.price} • 
                      Confidence: {(detected.confidence_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {detected.from_email} • {formatSADate(detected.received_at)}
                    </p>
                    <p className="text-xs bg-muted p-1 rounded mt-1">
                      Context: "{detected.context_text}"
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {detected.verified ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        ✅ Added
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => addDetectedProductToRFQ(detected)}
                          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                          ➕ Add to RFQ
                        </button>
                        <button
                          onClick={() => {
                            // Mark as dismissed (implementation needed)
                            console.log('Dismiss product:', detected.id);
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                        >
                          ❌ Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Quote Modal */}
      {showSendQuote && (
        <SendQuoteEmailModal
          rfqData={rfqData}
          products={products}
          templates={emailTemplates.filter(t => t.template_type === 'rfq_response')}
          quoteData={generateQuoteEmail()}
          onClose={() => setShowSendQuote(false)}
          onEmailSent={() => {
            setShowSendQuote(false);
            toast.success('Quote email sent successfully!');
          }}
        />
      )}
    </div>
  );
}
// Send Quote Email Modal
function SendQuoteEmailModal({ rfqData, products, templates, quoteData, onClose, onEmailSent }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    loadEmailAccounts();
    if (templates.length > 0) {
      setSelectedTemplate(templates[0].id);
      loadTemplate(templates[0]);
    }
  }, [templates]);

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

  const loadTemplate = (template) => {
    if (!template) return;
    
    // Replace template variables with quote data
    let subject = template.subject;
    let message = template.body_html;
    
    Object.keys(quoteData).forEach(key => {
      const placeholder = `{${key}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), quoteData[key]);
      message = message.replace(new RegExp(placeholder, 'g'), quoteData[key]);
    });
    
    setCustomSubject(subject);
    setCustomMessage(message);
  };

  const handleTemplateChange = async (templateId) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      try {
        const result = await window.electronAPI.query(`
          SELECT * FROM email_templates WHERE id = $1
        `, [templateId]);

        if (result.success && result.data[0]) {
          loadTemplate(result.data[0]);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const result = await window.electronAPI.invoke('email-send', {
        accountId: selectedAccount,
        to: rfqData.customer_email,
        subject: customSubject,
        html: customMessage,
        text: customMessage.replace(/<[^>]*>/g, '') // Strip HTML for text version
      });

      if (result.success) {
        // Create email campaign record
        await window.electronAPI.query(`
          INSERT INTO email_campaigns (
            name, template_id, email_account_id, customer_id, trigger_type,
            trigger_data, status, sent_at, created_by
          ) VALUES ($1, $2, $3, $4, 'rfq_response', $5, 'sent', NOW(), 1)
        `, [
          `RFQ ${rfqData.id} Quote Response`,
          useTemplate ? selectedTemplate : null,
          selectedAccount,
          rfqData.customer_id,
          JSON.stringify({ rfq_id: rfqData.id, ...quoteData })
        ]);

        onEmailSent();
      } else {
        alert('Failed to send email: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending quote email:', error);
      alert('Error sending email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Send Quote Email</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Settings */}
            <div className="grid grid-cols-3 gap-4">
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
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  To
                </label>
                <input
                  type="email"
                  value={rfqData.customer_email}
                  readOnly
                  className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
                />
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
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Quote Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Quote Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">RFQ ID:</span>
                  <span className="ml-2 font-medium">{quoteData.order_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="ml-2 font-medium">{quoteData.total_amount}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Products:</span>
                  <div className="ml-2 font-medium" dangerouslySetInnerHTML={{ __html: quoteData.product_list }} />
                </div>
              </div>
            </div>

            {/* Email Content */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Message
              </label>
              <textarea
                required
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={12}
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
                {sending ? 'Sending Quote...' : 'Send Quote Email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
