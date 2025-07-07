import React, { useState, useEffect } from 'react';
import { formatSATime, formatSADate } from '../../utils/timeZone';

export default function CallScheduler({ customer, onClose, onScheduled }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [callType, setCallType] = useState('follow_up');
  const [notes, setNotes] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT id, username, first_name, last_name, email 
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

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !assignedStaff) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
      
      const result = await window.electronAPI.query(`
        INSERT INTO scheduled_calls (
          customer_phone, 
          customer_name, 
          assigned_staff_id, 
          scheduled_at, 
          call_type, 
          notes, 
          status, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', NOW())
        RETURNING *
      `, [
        customer.customer_phone,
        customer.customer_name,
        assignedStaff,
        scheduledDateTime.toISOString(),
        callType,
        notes
      ]);

      if (result.success) {
        if (onScheduled) onScheduled(result.data[0]);
        onClose();
      }
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert('Failed to schedule call');
    } finally {
      setLoading(false);
    }
  };

  const scheduleAutoFollowUp = async () => {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    oneWeekFromNow.setHours(9, 0, 0, 0); // 9 AM

    setLoading(true);
    try {
      const autoNotes = notes.trim() || 'Automated 1-week follow-up';
      
      const result = await window.electronAPI.query(`
        INSERT INTO scheduled_calls (
          customer_phone, 
          customer_name, 
          assigned_staff_id, 
          scheduled_at, 
          call_type, 
          notes, 
          status, 
          created_at,
          auto_generated
        ) VALUES ($1, $2, $3, $4, 'follow_up', $5, 'scheduled', NOW(), true)
        RETURNING *
      `, [
        customer.customer_phone,
        customer.customer_name,
        null, // Will be assigned later
        oneWeekFromNow.toISOString(),
        autoNotes
      ]);

      if (result.success) {
        alert('Auto follow-up scheduled for 1 week from now');
        if (onScheduled) onScheduled(result.data[0]);
        onClose();
      }
    } catch (error) {
      console.error('Error scheduling auto follow-up:', error);
      alert('Failed to schedule auto follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Schedule Call</h3>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="p-3 bg-muted/20 rounded-lg">
              <p className="font-medium">{customer.customer_name}</p>
              <p className="text-sm text-muted-foreground">{customer.customer_phone}</p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Time *</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Staff Assignment */}
            <div>
              <label className="block text-sm font-medium mb-2">Assign to Staff *</label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select staff member...</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name} ({staff.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Call Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Call Type</label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="follow_up">Follow-up Call</option>
                <option value="sales">Sales Call</option>
                <option value="support">Support Call</option>
                <option value="rfq_discussion">RFQ Discussion</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border border-input rounded-md bg-background"
                placeholder="Additional notes for the call..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2 pt-4">
              <button
                onClick={handleSchedule}
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Scheduling...' : 'Schedule Call'}
              </button>
              
              <button
                onClick={scheduleAutoFollowUp}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Scheduling...' : 'Auto Schedule 1-Week Follow-up'}
              </button>
              
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
