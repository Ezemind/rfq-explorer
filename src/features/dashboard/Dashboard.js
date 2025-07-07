import React, { useState, useEffect } from 'react';
import ChatSidebar from '../chat/ChatSidebar';
import ChatWindow from '../chat/ChatWindow';
import CustomerPanel from '../customer/CustomerPanel';
import AdminSettings from '../admin/AdminSettings';
import FullCalendarView from '../calendar/FullCalendarView';
import notificationService from '../notifications/NotificationService';
import Header from '../../components/Header';
import { useAuth } from '../auth/useAuth';

export default function Dashboard({ user, theme, toggleTheme }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // New state for view management
  const [onMessageAdd, setOnMessageAdd] = useState(null); // Callback for adding messages
  const { logout } = useAuth();

  useEffect(() => {
    loadChats();
    // Set up real-time updates - check every 5 seconds for new messages
    const interval = setInterval(loadChats, 5000); // Changed from 30000 to 5000
    
    // Initialize notification service
    notificationService.initialize();
    
    // Listen for call notification events
    const handleOpenCall = (event) => {
      const { callId } = event.detail;
      console.log('Opening call from notification:', callId);
      // Open calendar view when notification is clicked
      setCurrentView('calendar');
    };
    
    window.addEventListener('openCall', handleOpenCall);
    
    return () => {
      clearInterval(interval);
      notificationService.stopChecking();
      window.removeEventListener('openCall', handleOpenCall);
    };
  }, [user.id, user.role]); // Re-load when user changes

  const loadChats = async () => {
    try {
      // Build the WHERE clause based on user role
      let whereClause = "WHERE (cs.status != 'closed' OR cs.status IS NULL)";
      let queryParams = [];
      
      // If user is not admin, only show chats assigned to them
      if (user.role !== 'admin') {
        whereClause += " AND cs.assigned_staff_id = $1";
        queryParams.push(user.id);
      }
      
      // Load chat sessions filtered by user role
      const chatResult = await window.electronAPI.query(`
        SELECT DISTINCT 
          cs.id,
          cs.customer_phone,
          cs.status as session_status,
          cs.last_message_at,
          cs.assigned_staff_id,
          c.name as customer_name,
          c.company,
          c.id as customer_id,
          c.email as customer_email,
          cm.message_text as last_message,
          cm.message_type as last_message_type,
          su.username as staff_assigned,
          su.first_name as staff_first_name,
          su.last_name as staff_last_name,
          'chat' as source_type,
          COUNT(cm_all.id) as message_count,
          COUNT(rfq.id) as rfq_count,
          COUNT(em.id) FILTER (WHERE em.direction = 'inbound' AND NOT em.is_read) as unread_email_count
        FROM chat_sessions cs
        LEFT JOIN customers c ON c.phone = cs.customer_phone
        LEFT JOIN staff_users su ON cs.assigned_staff_id = su.id
        LEFT JOIN LATERAL (
          SELECT message_text, message_type 
          FROM chat_messages 
          WHERE session_id = cs.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) cm ON true
        LEFT JOIN chat_messages cm_all ON cm_all.session_id = cs.id
        LEFT JOIN rfq_requests rfq ON rfq.customer_phone = cs.customer_phone
        LEFT JOIN email_messages em ON c.id = em.customer_id
        ${whereClause}
        GROUP BY cs.id, cs.customer_phone, cs.status, cs.last_message_at, 
                 cs.assigned_staff_id, c.name, c.company, c.id, c.email, cm.message_text, 
                 cm.message_type, su.username, su.first_name, su.last_name
        ORDER BY cs.last_message_at DESC NULLS LAST
      `, queryParams);

      if (chatResult.success) {
        // Process chats to add RFQ information in the display
        const processedChats = chatResult.data.map(chat => ({
          ...chat,
          display_name: chat.customer_name || chat.customer_phone,
          has_rfq: chat.rfq_count > 0,
          has_unread_emails: parseInt(chat.unread_email_count) > 0,
          unread_email_count: parseInt(chat.unread_email_count) || 0,
          last_message_display: chat.has_rfq && !chat.last_message 
            ? `RFQ Processing` 
            : chat.last_message || 'No messages yet'
        }));
        
        setChats(processedChats);
        console.log(`📱 Loaded chats for ${user.role}:`, processedChats.length);
        
        // Log email notification data for debugging
        const chatsWithEmails = processedChats.filter(chat => chat.has_unread_emails);
        if (chatsWithEmails.length > 0) {
          console.log(`📧 Customers with unread emails:`, chatsWithEmails.map(chat => ({
            name: chat.customer_name,
            phone: chat.customer_phone,
            unread_emails: chat.unread_email_count
          })));
        }
        console.log(`📱 Loaded chats for ${user.role}:`, processedChats.length);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setShowCustomerPanel(false);
  };

  const handleChatUpdate = (updatedChat, newMessage = null) => {
    setSelectedChat(updatedChat);
    // Also update the chat in the chats list
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat
      )
    );
    
    // If there's a new message, pass it to trigger direct message addition
    if (newMessage && onMessageAdd) {
      onMessageAdd(newMessage);
    }
  };

  const handleCustomerDetailsToggle = () => {
    setShowCustomerPanel(!showCustomerPanel);
  };

  const sendMessage = async (messageData) => {
    try {
      let result;
      
      if (messageData.file) {
        // Handle file upload
        result = await window.electronAPI.uploadFile({
          to: selectedChat.customer_phone,
          file: messageData.file,
          message: messageData.content
        });
        
        // If file upload failed, show informative message
        if (!result.success) {
          alert(`File upload failed: ${result.error}\n\nPlease send as text message instead.`);
          return { success: false, error: result.error };
        }
      } else {
        // Send regular message via WhatsApp API
        result = await window.electronAPI.sendMessage({
          to: selectedChat.customer_phone,
          message: messageData.content,
          type: messageData.type || 'text'
        });
      }

      if (result.success) {
        // Save to database
        // Get current timestamp in South Africa timezone
        const saTimestamp = new Date().toLocaleString('sv-SE', { 
          timeZone: 'Africa/Johannesburg' 
        });
        
        const dbResult = await window.electronAPI.query(`
          INSERT INTO chat_messages (session_id, customer_phone, message_text, message_type, sender_type, created_at, staff_user_id, media_url)
          VALUES ($1, $2, $3, $4, 'staff', $5, $6, $7)
        `, [
          selectedChat.id, 
          selectedChat.customer_phone, 
          messageData.content, 
          messageData.file ? 'file' : (messageData.type || 'text'), 
          saTimestamp,
          user.id,
          result.media_url || null
        ]);
        
        console.log('💾 Database insert result:', dbResult);

        // Update last message time with SA timezone
        const saTimestampUpdate = new Date().toLocaleString('sv-SE', { 
          timeZone: 'Africa/Johannesburg' 
        });
        
        await window.electronAPI.query(`
          UPDATE chat_sessions 
          SET last_message_at = $1
          WHERE id = $2
        `, [saTimestampUpdate, selectedChat.id]);

        // Create the new message object to add directly to ChatWindow
        const newMessage = {
          id: Date.now(), // Temporary ID until next refresh
          sender: 'staff',
          content: messageData.content,
          message_type: messageData.file ? 'file' : (messageData.type || 'text'),
          timestamp: saTimestamp,
          media_url: result.media_url || null,
          staff_user_id: user.id
        };

        // Add message directly to ChatWindow without full reload
        if (onMessageAdd) {
          onMessageAdd(newMessage);
        }

        // Lightweight refresh of chat list (without forcing message reload)
        setTimeout(() => {
          loadChats();
        }, 1000); // Small delay to ensure database is updated
        
        // Note: Windows notifications disabled to reduce interruptions
        // window.electronAPI.showNotification({
        //   title: messageData.file ? 'File Sent' : 'Message Sent',
        //   body: `${messageData.file ? 'File' : 'Message'} sent to ${selectedChat.customer_name || selectedChat.customer_phone}`
        // });

        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Render different views based on currentView state */}
      {currentView === 'settings' ? (
        <AdminSettings onClose={() => setCurrentView('dashboard')} />
      ) : currentView === 'calendar' ? (
        <FullCalendarView onClose={() => setCurrentView('dashboard')} user={user} />
      ) : (
        <>
          <Header 
            user={user} 
            theme={theme} 
            toggleTheme={toggleTheme}
            onLogout={logout}
            onAdminSettings={() => setCurrentView('settings')}
            onCalendarView={() => setCurrentView('calendar')}
          />
          
          <div className="flex-1 flex overflow-hidden">
            <ChatSidebar 
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              loading={loading}
            />
            
            <div className="flex-1 flex">
              <ChatWindow 
                selectedChat={selectedChat}
                onSendMessage={sendMessage}
                onCustomerDetails={handleCustomerDetailsToggle}
                onChatUpdate={handleChatUpdate}
                user={user}
                onSetMessageAddCallback={setOnMessageAdd}
              />
              
              {showCustomerPanel && selectedChat && (
                <CustomerPanel 
                  customer={selectedChat}
                  user={user}
                  onClose={() => setShowCustomerPanel(false)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
