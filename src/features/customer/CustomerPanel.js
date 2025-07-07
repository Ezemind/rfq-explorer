import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Phone, 
  Calendar, 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Clock,
  FileText,
  ShoppingBag,
  Plus,
  ArrowLeft,
  MessageSquare,
  Globe
} from 'lucide-react';
import { formatSADate, formatSADateTime } from '../../utils/timeZone';
import { assignBranch } from '../../utils/branchAssignment';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import CallScheduler from '../calendar/CallScheduler';
import CalendarView from '../calendar/CalendarView';
import EmailView from '../email/EmailView';
import CustomerEmailIntegration from './components/CustomerEmailIntegration';

export default function CustomerPanel({ customer, onClose, user }) {
  const [customerData, setCustomerData] = useState(null);
  const [rfqRequests, setRfqRequests] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showCallScheduler, setShowCallScheduler] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showEmailCompose, setShowEmailCompose] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [customer]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const customerResult = await window.electronAPI.query(`
        SELECT * FROM customers WHERE phone = $1
      `, [customer.customer_phone]);

      const rfqResult = await window.electronAPI.query(`
        SELECT r.*, array_agg(
          json_build_object(
            'id', p.id,
            'name', p.product_name,
            'sku', p.product_sku,
            'quantity', p.quantity,
            'price', p.price,
            'total', p.total,
            'product_id', p.product_id,
            'variation_id', p.variation_id
          ) ORDER BY p.id
        ) as products
        FROM rfq_requests r
        LEFT JOIN rfq_products p ON r.id = p.rfq_id
        WHERE r.customer_phone = $1
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `, [customer.customer_phone]);

      const notesResult = await window.electronAPI.query(`
        SELECT cn.*, su.username as staff_name, su.first_name, su.last_name
        FROM customer_notes cn
        LEFT JOIN staff_users su ON cn.created_by = su.id
        WHERE cn.customer_phone = $1
        ORDER BY cn.created_at DESC
      `, [customer.customer_phone]);

      if (customerResult.success) {
        setCustomerData(customerResult.data[0] || null);
      }
      if (rfqResult.success) {
        setRfqRequests(rfqResult.data);
      }
      if (notesResult.success) {
        setNotes(notesResult.data);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'details', name: 'Details', icon: User },
    { id: 'orders', name: 'Orders', icon: ShoppingBag, count: rfqRequests.length },
    { id: 'notes', name: 'Notes', icon: FileText, count: notes.length },
    { id: 'emails', name: 'Emails', icon: Mail }
  ];

  if (loading) {
    return (
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[500px] bg-white dark:bg-black border-l border-slate-200 dark:border-slate-800"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Customer Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-[500px] bg-white dark:bg-black border-l border-slate-200 dark:border-slate-800 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Customer Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCallScheduler(true)}
            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            size="sm"
          >
            <Phone className="h-4 w-4 mr-2" />
            Schedule Call
          </Button>
          <Button
            onClick={() => setShowEmailCompose(true)}
            variant="outline"
            size="sm"
            disabled={!customerData?.email}
            title={!customerData?.email ? "Customer email not available" : "Send email to customer"}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowCalendarView(true)}
            variant="outline"
            size="sm"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors relative ${
                  isActive
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{tab.name}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {activeTab === 'details' && (
              <CustomerDetails customer={customerData} phone={customer.customer_phone} />
            )}
            {activeTab === 'orders' && (
              <RFQList requests={rfqRequests} />
            )}
            {activeTab === 'notes' && (
              <NotesSection 
                notes={notes} 
                customerPhone={customer.customer_phone} 
                onNotesUpdate={loadCustomerData} 
              />
            )}
            {activeTab === 'emails' && (
              <CustomerEmailIntegration 
                customerId={customerData?.id} 
                customerEmail={customerData?.email}
                customerName={customerData?.name}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {showCallScheduler && (
          <CallScheduler
            customer={customer}
            onClose={() => setShowCallScheduler(false)}
            onScheduled={(scheduledCall) => {
              console.log('Call scheduled:', scheduledCall);
              setShowCallScheduler(false);
            }}
          />
        )}
        
        {showCalendarView && (
          <CalendarView onClose={() => setShowCalendarView(false)} user={user} />
        )}
        
        {showEmailCompose && customerData && (
          <EmailView
            onClose={() => setShowEmailCompose(false)}
            emailType="compose"
            customerId={customerData.id}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
// Customer Details Component
function CustomerDetails({ customer, phone }) {
  if (!customer) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-400">No customer data found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Phone: {phone}</p>
      </motion.div>
    );
  }

  const getInitials = (name) => {
    if (!name) return phone.slice(-2);
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  // Determine branch assignment based on customer address
  const branchInfo = assignBranch(customer.address || customer.city);
  
  // Extract city from address if available
  const getCity = () => {
    if (customer.city) return customer.city;
    if (customer.address) {
      // Try to extract city from address (simple heuristic)
      const parts = customer.address.split(',').map(p => p.trim());
      if (parts.length > 1) {
        // Usually city is the second-to-last part in South African addresses
        return parts[parts.length - 2] || parts[parts.length - 1];
      }
      return customer.address;
    }
    return null;
  };

  const city = getCity();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Profile Section */}
      <div className="text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xl font-bold">
            {getInitials(customer.name)}
          </AvatarFallback>
        </Avatar>
        <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {customer.name || 'Unknown Customer'}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-1">
          <Phone className="w-4 h-4" />
          {customer.phone}
        </p>
      </div>

      {/* Information Cards */}
      <div className="space-y-4">
        {customer.email && (
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{customer.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {customer.company && (
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Company</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{customer.company}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {(customer.address || city) && (
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {customer.address ? 'Address' : 'City'}
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {customer.address || city}
                  </p>
                  {customer.address && city && city !== customer.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      City: {city}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branch Assignment Card */}
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                branchInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                branchInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900' :
                branchInfo.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900' :
                'bg-gray-100 dark:bg-gray-900'
              }`}>
                <Globe className={`w-4 h-4 ${
                  branchInfo.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  branchInfo.color === 'green' ? 'text-green-600 dark:text-green-400' :
                  branchInfo.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                  'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Assigned Branch</p>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      branchInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      branchInfo.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      branchInfo.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {branchInfo.branchCode}
                  </Badge>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {branchInfo.branch}
                </p>
                {branchInfo.matchedArea && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Matched: {branchInfo.matchedArea}
                  </p>
                )}
                {branchInfo.confidence !== 'high' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Confidence: {branchInfo.confidence}
                  </p>
                )}
              </div>
            </div>
            {branchInfo.description && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Coverage: {branchInfo.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer Since</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {formatSADate(customer.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// Enhanced RFQ List Component
function RFQList({ requests }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (requests.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-400">No orders found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Orders will appear here when created</p>
      </motion.div>
    );
  }

  const formatCurrency = (amount, currency = 'ZAR') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  if (selectedOrder) {
    return <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} formatCurrency={formatCurrency} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Order History</h4>
        <Badge variant="secondary">
          {requests.length} {requests.length === 1 ? 'order' : 'orders'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {requests.map((rfq, index) => (
          <motion.div
            key={rfq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => setSelectedOrder(rfq)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                      Order #{rfq.order_number}
                    </h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      RFQ ID: {rfq.id}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      rfq.status === 'pending' ? 'warning' :
                      rfq.status === 'processing' ? 'default' :
                      rfq.status === 'completed' ? 'success' :
                      rfq.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {rfq.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatSADate(rfq.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Total:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(rfq.total_amount, rfq.currency)}
                    </span>
                  </div>
                </div>
                
                {rfq.products && rfq.products.length > 0 && rfq.products[0].name && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Products ({rfq.products.length}):
                    </p>
                    {rfq.products.slice(0, 2).map((product, idx) => (
                      <div key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span className="w-1 h-1 bg-slate-400 rounded-full" />
                        {product.name} - Qty: {product.quantity}
                      </div>
                    ))}
                    {rfq.products.length > 2 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        + {rfq.products.length - 2} more items
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
// Order Detail View Component
function OrderDetailView({ order, onBack, formatCurrency }) {
  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
          Order #{order.order_number}
        </h4>
      </div>
      
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Order ID</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{order.order_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Date</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formatSADate(order.created_at)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
            <Badge 
              variant={
                order.status === 'pending' ? 'warning' :
                order.status === 'processing' ? 'default' :
                order.status === 'completed' ? 'success' :
                order.status === 'cancelled' ? 'destructive' :
                'secondary'
              }
            >
              {order.status}
            </Badge>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="font-medium text-slate-900 dark:text-slate-100">Total</span>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {formatCurrency(order.total_amount, order.currency)}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {order.products && order.products.length > 0 && order.products[0].name && (
        <div className="space-y-3">
          <h5 className="font-semibold text-slate-900 dark:text-slate-100">Products</h5>
          {order.products.map((product, index) => (
            <Card key={index} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h6 className="font-medium text-slate-900 dark:text-slate-100">
                      {product.name}
                    </h6>
                    {product.sku && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Quantity</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{product.quantity}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Unit Price</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(product.price, order.currency)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400">Total</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(product.total, order.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Enhanced Notes Section Component
function NotesSection({ notes, customerPhone, onNotesUpdate }) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || saving) return;

    setSaving(true);
    try {
      const result = await window.electronAPI.query(`
        INSERT INTO customer_notes (customer_phone, note_text, content, staff_user_id, created_by, created_at)
        VALUES ($1, $2, $2, (SELECT id FROM staff_users WHERE username = 'Pieter87'), (SELECT id FROM staff_users WHERE username = 'Pieter87'), NOW())
      `, [customerPhone, newNote.trim()]);

      if (result.success) {
        setNewNote('');
        onNotesUpdate();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Add Note Form */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="space-y-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this customer..."
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 resize-none"
              rows="3"
            />
            <Button
              type="submit"
              disabled={!newNote.trim() || saving}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            >
              {saving ? 'Adding...' : 'Add Note'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="font-semibold text-slate-900 dark:text-slate-100">Customer Notes</h5>
          <Badge variant="secondary">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Badge>
        </div>
        
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">No notes yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add your first note above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-900 dark:text-slate-100 mb-3 whitespace-pre-wrap leading-relaxed">
                      {note.note_text}
                    </p>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {note.first_name && note.last_name 
                          ? `${note.first_name} ${note.last_name}` 
                          : note.staff_name || 'Unknown Staff'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatSADate(note.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}