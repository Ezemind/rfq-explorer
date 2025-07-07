import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  FileText,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatSATime, formatSADate } from '../../utils/timeZone';
import CallScheduler from './CallScheduler';
import { MonthView, WeekView, DayView, ListView, CallDetailModal } from './CalendarComponents';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function FullCalendarView({ onClose, user }) {
  const confirm = useConfirm();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day', 'list'
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Generate calendar data based on current view
  const getCalendarData = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday
      
      const days = [];
      for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
      return { days, firstDay, lastDay };
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push(date);
      }
      return { days, firstDay: days[0], lastDay: days[6] };
    } else if (viewMode === 'day') {
      return { days: [currentDate], firstDay: currentDate, lastDay: currentDate };
    }
    return { days: [], firstDay: null, lastDay: null };
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadScheduledCalls();
    loadStaffList();
  }, [currentDate, viewMode, staffFilter, statusFilter, user.id, user.role]);

  const loadStaffList = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT id, username, first_name, last_name 
        FROM staff_users 
        WHERE is_active = true
        ORDER BY first_name, last_name
      `);
      
      if (result.success) {
        setStaffList(result.data);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadScheduledCalls = async () => {
    setLoading(true);
    try {
      const { firstDay, lastDay } = getCalendarData();
      if (!firstDay || !lastDay) return;

      let query = `
        SELECT 
          sc.*,
          su.first_name as staff_first_name,
          su.last_name as staff_last_name,
          su.username as staff_username,
          c.name as customer_name,
          c.company as customer_company
        FROM scheduled_calls sc
        LEFT JOIN staff_users su ON sc.assigned_staff_id = su.id
        LEFT JOIN customers c ON c.phone = sc.customer_phone
        WHERE sc.scheduled_at >= $1 AND sc.scheduled_at <= $2
      `;
      
      let params = [firstDay.toISOString(), lastDay.toISOString()];
      
      // Role-based filtering
      if (user.role !== 'admin') {
        query += ` AND sc.assigned_staff_id = $${params.length + 1}`;
        params.push(user.id);
      } else if (staffFilter) {
        query += ` AND sc.assigned_staff_id = $${params.length + 1}`;
        params.push(staffFilter);
      }
      
      // Status filtering
      if (statusFilter) {
        query += ` AND sc.status = $${params.length + 1}`;
        params.push(statusFilter);
      }
      
      query += ` ORDER BY sc.scheduled_at ASC`;

      const result = await window.electronAPI.query(query, params);
      
      if (result.success) {
        setScheduledCalls(result.data);
      }
    } catch (error) {
      console.error('Error loading scheduled calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCallsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledCalls.filter(call => {
      const callDate = new Date(call.scheduled_at).toISOString().split('T')[0];
      return callDate === dateStr;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'missed': return <XCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const updateCallStatus = async (callId, newStatus) => {
    try {
      const result = await window.electronAPI.query(`
        UPDATE scheduled_calls 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `, [newStatus, callId]);
      
      if (result.success) {
        loadScheduledCalls();
        setSelectedCall(null);
      }
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  };

  const deleteCall = async (callId) => {
    const confirmed = await confirm({
      title: "Delete Scheduled Call",
      message: "Are you sure you want to delete this scheduled call? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });
    
    if (!confirmed) return;
    
    try {
      const result = await window.electronAPI.query(`
        DELETE FROM scheduled_calls WHERE id = $1
      `, [callId]);
      
      if (result.success) {
        loadScheduledCalls();
        setSelectedCall(null);
      }
    } catch (error) {
      console.error('Error deleting call:', error);
    }
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    const options = { 
      year: 'numeric', 
      month: 'long',
      ...(viewMode === 'day' && { day: 'numeric' })
    };
    return currentDate.toLocaleDateString('en-ZA', options);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Calendar & Schedule
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage appointments and calls
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Calendar Navigation & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateCalendar(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
                  {formatDateHeader()}
                </h3>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateCalendar(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {[
                  { mode: 'month', icon: Grid3X3, label: 'Month' },
                  { mode: 'week', icon: List, label: 'Week' },
                  { mode: 'day', icon: Eye, label: 'Day' },
                  { mode: 'list', icon: List, label: 'List' }
                ].map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="rounded-none"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              
              <Button
                onClick={() => setShowScheduler(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Staff Member</label>
                    <select
                      value={staffFilter}
                      onChange={(e) => setStaffFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="">All Staff</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="">All Statuses</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'month' && (
            <MonthView 
              calendarData={getCalendarData()}
              getCallsForDate={getCallsForDate}
              getStatusColor={getStatusColor}
              onCallClick={setSelectedCall}
              currentDate={currentDate}
            />
          )}
          
          {viewMode === 'week' && (
            <WeekView 
              calendarData={getCalendarData()}
              getCallsForDate={getCallsForDate}
              getStatusColor={getStatusColor}
              onCallClick={setSelectedCall}
              currentDate={currentDate}
            />
          )}
          
          {viewMode === 'day' && (
            <DayView 
              currentDate={currentDate}
              calls={getCallsForDate(currentDate)}
              getStatusColor={getStatusColor}
              onCallClick={setSelectedCall}
            />
          )}
          
          {viewMode === 'list' && (
            <ListView 
              calls={scheduledCalls}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              onCallClick={setSelectedCall}
              loading={loading}
            />
          )}
        </div>

        {/* Call Detail Modal */}
        <AnimatePresence>
          {selectedCall && (
            <CallDetailModal
              call={selectedCall}
              onClose={() => setSelectedCall(null)}
              onUpdateStatus={updateCallStatus}
              onDelete={deleteCall}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          )}
        </AnimatePresence>

        {/* Call Scheduler Modal */}
        <AnimatePresence>
          {showScheduler && (
            <CallScheduler
              customer={{ customer_phone: '', customer_name: 'New Customer' }}
              onClose={() => setShowScheduler(false)}
              onScheduled={() => {
                setShowScheduler(false);
                loadScheduledCalls();
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
