import React, { useState, useEffect } from 'react';

export default function StaffAssignment({ selectedChat, onAssignmentChange }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Safety check - don't render if selectedChat is missing
  if (!selectedChat) {
    return null;
  }

  useEffect(() => {
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      const result = await window.electronAPI.query(`
        SELECT id, username, first_name, last_name, role 
        FROM staff_users 
        WHERE is_active = true 
        ORDER BY first_name, last_name
      `);
      
      if (result.success) {
        setStaffList(result.data);
      }
    } catch (error) {
      console.error('Error loading staff list:', error);
    }
  };

  const handleAssignment = async (staffId) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.query(`
        UPDATE chat_sessions 
        SET assigned_staff_id = $1, updated_at = NOW() 
        WHERE id = $2
      `, [staffId || null, selectedChat?.id]);

      if (result.success) {
        onAssignmentChange(staffId);
        setDropdownOpen(false);
        
        // Show notification
        const selectedStaff = staffList.find(s => s.id === staffId);
        window.electronAPI.showNotification({
          title: 'Staff Assignment Updated',
          body: staffId 
            ? `Chat assigned to ${selectedStaff?.first_name} ${selectedStaff?.last_name}`
            : 'Chat assignment removed'
        });
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentAssignment = staffList.find(s => s.id === selectedChat?.assigned_staff_id);

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={loading}
        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        <span>
          {currentAssignment 
            ? `${currentAssignment.first_name} ${currentAssignment.last_name}`
            : 'Assign Staff'}
        </span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute top-full mt-1 right-0 w-64 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="p-2 border-b border-border">
            <h4 className="font-medium text-foreground">Assign to Staff</h4>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {/* Unassign option */}
            <button
              onClick={() => handleAssignment(null)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center space-x-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Unassigned</p>
                <p className="text-sm text-muted-foreground">Remove assignment</p>
              </div>
            </button>
            
            {staffList.map((staff) => (
              <button
                key={staff.id}
                onClick={() => handleAssignment(staff.id)}
                className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center space-x-2 ${
                  currentAssignment?.id === staff.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                  {staff.first_name?.charAt(0)}{staff.last_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{staff.first_name} {staff.last_name}</p>
                  <p className="text-sm text-muted-foreground">@{staff.username} • {staff.role}</p>
                </div>
                {currentAssignment?.id === staff.id && (
                  <svg className="w-4 h-4 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}