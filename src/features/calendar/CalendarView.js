import React, { useState, useEffect } from 'react';
import { formatSATime, formatSADate } from '../../utils/timeZone';

export default function CalendarView({ onClose, user }) {
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [staffFilter, setStaffFilter] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'upcoming'

  useEffect(() => {
    loadScheduledCalls();
    loadStaffList();
  }, [selectedDate, staffFilter, viewMode, user.id, user.role]);

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
      let query, params;
      
      if (viewMode === 'upcoming') {
        // Show all upcoming calls (future dates only)
        query = `
          SELECT 
            sc.*,
            su.first_name as staff_first_name,
            su.last_name as staff_last_name,
            su.username as staff_username
          FROM scheduled_calls sc
          LEFT JOIN staff_users su ON sc.assigned_staff_id = su.id
          WHERE sc.scheduled_at >= NOW() AND sc.status != 'completed'
        `;
        params = [];
        
        // Filter by user role
        if (user.role !== 'admin') {
          query += ` AND sc.assigned_staff_id = $${params.length + 1}`;
          params.push(user.id);
        } else if (staffFilter) {
          query += ` AND sc.assigned_staff_id = $${params.length + 1}`;
          params.push(staffFilter);
        }
        
        query += ` ORDER BY sc.scheduled_at ASC LIMIT 50`;
      } else {
        // Daily view (existing functionality)
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);

        query = `
          SELECT 
            sc.*,
            su.first_name as staff_first_name,
            su.last_name as staff_last_name,
            su.username as staff_username
          FROM scheduled_calls sc
          LEFT JOIN staff_users su ON sc.assigned_staff_id = su.id
          WHERE sc.scheduled_at >= $1 AND sc.scheduled_at < $2
        `;
        
        params = [startDate.toISOString(), endDate.toISOString()];
        
        // Filter by user role
        if (user.role !== 'admin') {
          query += ` AND sc.assigned_staff_id = $${params.length + 1}`;
          params.push(user.id);
        } else if (staffFilter) {
          query += ` AND sc.assigned_staff_id = $${params.length + 1}`;
          params.push(staffFilter);
        }
        
        query += ` ORDER BY sc.scheduled_at ASC`;
      }

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

  const updateCallStatus = async (callId, newStatus) => {
    try {
      const result = await window.electronAPI.query(`
        UPDATE scheduled_calls 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `, [newStatus, callId]);
      
      if (result.success) {
        loadScheduledCalls(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCallTime = (timestamp) => {
    return formatSATime(timestamp);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Call Calendar</h3>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex space-x-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">View</label>
              <div className="flex rounded-md border border-input">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 text-sm rounded-l-md transition-colors ${
                    viewMode === 'daily' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  Daily View
                </button>
                <button
                  onClick={() => setViewMode('upcoming')}
                  className={`px-4 py-2 text-sm rounded-r-md transition-colors ${
                    viewMode === 'upcoming' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  All Upcoming
                </button>
              </div>
            </div>
            
            {viewMode === 'daily' && (
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Staff Member</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">All Staff</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduled Calls */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold">
              {viewMode === 'daily' 
                ? `Scheduled Calls for ${formatSADate(selectedDate)}`
                : `All Upcoming Scheduled Calls (${scheduledCalls.length})`
              }
            </h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : scheduledCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{viewMode === 'daily' ? 'No calls scheduled for this date' : 'No upcoming calls scheduled'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledCalls.map(call => (
                  <CallItem 
                    key={call.id} 
                    call={call} 
                    onUpdateStatus={updateCallStatus}
                    getStatusColor={getStatusColor}
                    formatCallTime={formatCallTime}
                    showDate={viewMode === 'upcoming'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CallItem({ call, onUpdateStatus, getStatusColor, formatCallTime, showDate }) {
  const formatDateTime = (timestamp) => {
    if (showDate) {
      return formatSADate(timestamp) + ' at ' + formatCallTime(timestamp);
    }
    return formatCallTime(timestamp);
  };

  return (
    <div className="bg-muted/20 rounded-lg p-4 border">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="font-medium">{call.customer_name}</h5>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(call.status)}`}>
              {call.status}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatDateTime(call.scheduled_at)}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>📞 {call.customer_phone}</p>
            {call.staff_first_name && (
              <p>👤 {call.staff_first_name} {call.staff_last_name}</p>
            )}
            <p>📋 {call.call_type}</p>
            {call.notes && <p>📝 {call.notes}</p>}
            {call.auto_generated && (
              <p className="text-blue-600">🤖 Auto-generated follow-up</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {call.status === 'scheduled' && (
            <>
              <button
                onClick={() => onUpdateStatus(call.id, 'completed')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Mark Complete
              </button>
              <button
                onClick={() => onUpdateStatus(call.id, 'missed')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Mark Missed
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
