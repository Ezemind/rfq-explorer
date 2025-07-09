import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Mail, 
  Settings as SettingsIcon, 
  Database, 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Calendar,
  Shield,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { LoadingSpinner } from '../../components/ui/loading';
import { SystemStatus } from '../../components/ui/system-status';
import { ScrollableContainer } from '../../components/ui/scrollable-container';
import { cn } from '../../lib/utils';
import { formatSADate } from '../../utils/timeZone';
import EmailManagement from './components/EmailManagement';
import UpdateSettings from '../../components/UpdateSettings';
import { useToast } from '../../contexts/ToastContext';
import { useInlineNotification } from '../../hooks/useNotification';
import InlineNotification from '../../components/ui/InlineNotification';

const tabs = [
  { id: 'users', name: 'Staff Users', icon: Users, description: 'Manage staff accounts and permissions' },
  { id: 'email', name: 'Email Management', icon: Mail, description: 'Configure email settings and templates' },
  { id: 'settings', name: 'System Settings', icon: SettingsIcon, description: 'Application configuration and preferences' },
  { id: 'database', name: 'Database Info', icon: Database, description: 'Database statistics and connection details' }
];

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

export default function AdminSettings({ onClose }) {
  const toast = useToast();  const notification = useInlineNotification();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.query(`
        SELECT id, username, email, first_name, last_name, role, is_active, created_at, last_login
        FROM staff_users 
        ORDER BY created_at DESC
      `);
      
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const result = await window.electronAPI.query(`
        UPDATE staff_users 
        SET is_active = $1, updated_at = NOW() 
        WHERE id = $2
      `, [!currentStatus, userId]);
      
      if (result.success) {        notification.success(
          `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        );
        loadUsers();
      } else {
        notification.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      notification.error('Failed to update user status');
    }
  };

  const resetUserPassword = async (userId, username) => {
    if (!window.confirm(`Reset password for user "${username}"?\n\nThis will generate a new temporary password that you can provide to the user.`)) {
      return;
    }

    try {
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
      
      const result = await window.electronAPI.resetUserPassword({
        userId: userId,
        newPassword: tempPassword
      });
      
      if (result.success) {
        notification.success(
          'Password reset successfully!',
          { duration: 8000 }
        );
        
        // Show the temporary password to admin
        alert(`Password reset successful!\n\nUser: ${username}\nNew Temporary Password: ${tempPassword}\n\nPlease provide this password to the user securely.\nAdvise them to change it after logging in.`);
        
        loadUsers();
      } else {
        notification.error('Failed to reset password: ' + result.error);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      notification.error('Failed to reset password');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 bg-grid-16 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-slate-900/5" />
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 relative"
      >        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Admin Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Manage your application settings and user accounts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SystemStatus />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10 flex-1 overflow-hidden">
        <div className="grid grid-cols-12 gap-8 h-full">
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-3"
          >            <Card className="sticky top-32 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[calc(100vh-200px)] overflow-y-auto">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                          isActive 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-medium truncate",
                            isActive ? "text-white" : "text-slate-900 dark:text-slate-100"
                          )}>{tab.name}</div>
                          <div className={cn(
                            "text-xs truncate mt-0.5",
                            isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-500"
                          )}>
                            {tab.description}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </motion.div>
          {/* Main Content */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="col-span-9 flex flex-col min-h-0"
          >
            {/* Inline notification */}
            <AnimatePresence>
              {notification.notification && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <InlineNotification
                    type={notification.notification.type}
                    message={notification.notification.message}
                    onDismiss={notification.dismiss}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  {activeTab === 'users' && (
                    <UserManagement 
                      users={filteredUsers} 
                      loading={loading} 
                      onToggleStatus={toggleUserStatus}
                      onResetPassword={resetUserPassword}
                      onAddUser={() => setShowAddUser(true)}
                      onRefresh={loadUsers}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      filterStatus={filterStatus}
                      setFilterStatus={setFilterStatus}
                    />
                  )}
                  {activeTab === 'email' && <EmailManagementWrapper />}
                  {activeTab === 'settings' && <SystemSettingsWrapper />}
                  {activeTab === 'database' && <DatabaseInfoWrapper />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <AddUserModal 
            onClose={() => setShowAddUser(false)}
            onUserAdded={() => {
              setShowAddUser(false);
              loadUsers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// User Management Component
function UserManagement({ 
  users, 
  loading, 
  onToggleStatus, 
  onResetPassword,
  onAddUser, 
  onRefresh,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus 
}) {
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const result = await window.electronAPI.query(`
          DELETE FROM staff_users WHERE id = $1
        `, [userId]);
        
        if (result.success) {
          onRefresh();
        } else {
          alert('Failed to delete user: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
      }
    }
  };
  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Staff Users
                <Badge variant="secondary" className="ml-2">
                  {users.length} total
                </Badge>
              </CardTitle>
              <CardDescription>
                Manage staff accounts, roles, and permissions
              </CardDescription>
            </div>
            <Button
              onClick={onAddUser}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-md text-sm"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Users Grid */}
      <div className="grid gap-6">
        {users.length === 0 ? (
          <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || filterStatus !== 'all' ? 'No users match your filters' : 'No users found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {user.first_name?.charAt(0) || user.username?.charAt(0)}
                          {user.last_name?.charAt(0) || user.username?.charAt(1)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : user.username}
                          </h4>
                          <Badge 
                            variant={user.is_active ? "success" : "destructive"}
                            className="flex-shrink-0"
                          >
                            {user.is_active ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          @{user.username} • {user.role}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Email:</span>
                            <p className="text-slate-900 dark:text-slate-100 truncate">
                              {user.email || 'Not set'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Last Login:</span>
                            <p className="text-slate-900 dark:text-slate-100">
                              {user.last_login ? formatSADate(user.last_login) : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={cn(
                          "transition-all duration-200",
                          user.is_active
                            ? "hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
                            : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-400"
                        )}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResetPassword(user.id, user.username)}
                        className="hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 dark:hover:bg-orange-950 dark:hover:text-orange-400 transition-all duration-200"
                        title="Reset user password"
                      >
                        Reset Password
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                      >
                        Edit
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <EditUserModal 
            user={editingUser}
            onClose={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}
            onUserUpdated={() => {
              setShowEditModal(false);
              setEditingUser(null);
              onRefresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
// Email Management Wrapper
function EmailManagementWrapper() {
  return (
    <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
            <Mail className="h-6 w-6 text-white" />
          </div>
          Email Management
        </CardTitle>
        <CardDescription>
          Configure email settings, templates, and automation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollableContainer className="h-full">
          <EmailManagement />
        </ScrollableContainer>
      </CardContent>
    </Card>
  );
}

// System Settings Wrapper
function SystemSettingsWrapper() {
  const [railwayUrl, setRailwayUrl] = useState('https://bob-explorer-webhook-production.up.railway.app');
  
  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            System Settings
          </CardTitle>
          <CardDescription>
            Configure application settings and integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              WhatsApp Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number ID
                </label>
                <Input
                  value="581006905101002"
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Railway Webhook URL
                </label>
                <Input
                  value={railwayUrl}
                  onChange={(e) => setRailwayUrl(e.target.value)}
                  className="bg-white/50 dark:bg-slate-800/50"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-500" />
              Media Storage Configuration
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Media files are stored via Railway webhook at:
              </p>
              <code className="block text-sm bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 font-mono">
                {railwayUrl}/media/
              </code>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Images: /media/images/
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Audio: /media/audio/
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Documents: /media/documents/
                </div>
              </div>
            </div>
          </div>
          
          <UpdateSettings />
        </CardContent>
      </Card>
    </div>
  );
}
// Database Info Wrapper
function DatabaseInfoWrapper() {
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const results = await Promise.all([
        window.electronAPI.query('SELECT COUNT(*) FROM staff_users'),
        window.electronAPI.query('SELECT COUNT(*) FROM customers'),
        window.electronAPI.query('SELECT COUNT(*) FROM chat_sessions'),
        window.electronAPI.query('SELECT COUNT(*) FROM chat_messages'),
        window.electronAPI.query('SELECT COUNT(*) FROM rfq_requests'),
        window.electronAPI.query('SELECT COUNT(*) FROM customer_notes'),
        window.electronAPI.query(`SELECT COUNT(*) FROM chat_messages WHERE media_url IS NOT NULL`)
      ]);

      if (results.every(r => r.success)) {
        setDbStats({
          staff_users: results[0].data[0].count,
          customers: results[1].data[0].count,
          chat_sessions: results[2].data[0].count,
          chat_messages: results[3].data[0].count,
          rfq_requests: results[4].data[0].count,
          customer_notes: results[5].data[0].count,
          media_messages: results[6].data[0].count
        });
      }
    } catch (error) {
      console.error('Error loading database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Staff Users', value: dbStats?.staff_users, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Customers', value: dbStats?.customers, icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Chat Sessions', value: dbStats?.chat_sessions, icon: Mail, color: 'from-purple-500 to-purple-600' },
    { label: 'Messages', value: dbStats?.chat_messages, icon: Mail, color: 'from-indigo-500 to-indigo-600' },
    { label: 'RFQ Requests', value: dbStats?.rfq_requests, icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { label: 'Customer Notes', value: dbStats?.customer_notes, icon: SettingsIcon, color: 'from-pink-500 to-pink-600' },
    { label: 'Media Messages', value: dbStats?.media_messages, icon: Database, color: 'from-teal-500 to-teal-600' },
  ];

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading database statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            Database Statistics
          </CardTitle>
          <CardDescription>
            Real-time insights into your application data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {stat.value?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className={cn(
                          "p-3 rounded-lg bg-gradient-to-br",
                          stat.color
                        )}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Connection Details
          </CardTitle>
          <CardDescription>
            Database connection and configuration information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
            {[
              { label: 'Host', value: 'switchback.proxy.rlwy.net' },
              { label: 'Port', value: '27066' },
              { label: 'Database', value: 'railway' },
              { label: 'SSL', value: 'Enabled' },
            ].map((detail, index) => (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex justify-between items-center py-2"
              >
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {detail.label}:
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-mono text-sm bg-white dark:bg-slate-900 px-3 py-1 rounded border">
                  {detail.value}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// Add User Modal Component
function AddUserModal({ onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'staff',
    mobileNumber: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Hash the password using the electronAPI
      const hashResult = await window.electronAPI.hashPassword(formData.password);
      
      if (!hashResult.success) {
        alert('Failed to process password: ' + hashResult.error);
        setSaving(false);
        return;
      }

      const result = await window.electronAPI.query(`
        INSERT INTO staff_users (
          username, email, first_name, last_name, password_hash, role, 
          mobile_number, is_active, created_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), 1)
      `, [
        formData.username,
        formData.email || null,
        formData.firstName || null,
        formData.lastName || null,
        hashResult.hash,
        formData.role,
        formData.mobileNumber || null
      ]);

      if (result.success) {
        onUserAdded();
      } else {
        alert('Failed to create user: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            Add New Staff User
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create a new staff account with appropriate permissions
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-96">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username *
            </label>
            <Input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="bg-white/50 dark:bg-slate-800/50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="bg-white/50 dark:bg-slate-800/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="bg-white/50 dark:bg-slate-800/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-white/50 dark:bg-slate-800/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Temporary Password *
            </label>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="User should change on first login"
              className="bg-white/50 dark:bg-slate-800/50"
            />
          </div>
        </form>
        
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            onClick={handleSubmit}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
// Edit User Modal Component
function EditUserModal({ user, onClose, onUserUpdated }) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    role: user.role || 'staff',
    mobileNumber: user.mobile_number || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await window.electronAPI.query(`
        UPDATE staff_users 
        SET username = $1, email = $2, first_name = $3, last_name = $4, role = $5, mobile_number = $6, updated_at = NOW()
        WHERE id = $7
      `, [
        formData.username,
        formData.email || null,
        formData.firstName || null,
        formData.lastName || null,
        formData.role,
        formData.mobileNumber || null,
        user.id
      ]);

      if (result.success) {
        onUserUpdated();
      } else {
        alert('Failed to update user: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            Edit User: {user.username}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Update user information and permissions
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-96">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username *
            </label>
            <Input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="bg-white/50 dark:bg-slate-800/50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="bg-white/50 dark:bg-slate-800/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="bg-white/50 dark:bg-slate-800/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-white/50 dark:bg-slate-800/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mobile Number
            </label>
            <Input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
              className="bg-white/50 dark:bg-slate-800/50"
            />
          </div>
        </form>
        
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            onClick={handleSubmit}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Update User
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}