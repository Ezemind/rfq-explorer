import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Phone, FileText, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatSATime, formatSADate } from '../../utils/timeZone';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// Month View Component
export function MonthView({ calendarData, getCallsForDate, getStatusColor, onCallClick, currentDate }) {
  const { days } = calendarData;
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-0">
        {days.map((date, index) => {
          const calls = getCallsForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isCurrentMonth = date.getMonth() === currentMonth;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`
                border-r border-b border-slate-200 dark:border-slate-700 p-2 min-h-[120px] 
                ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-800 text-slate-400' : 'bg-white dark:bg-slate-900'}
                hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
              `}
            >
              <div className={`
                text-sm font-medium mb-2 
                ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
              `}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {calls.slice(0, 3).map(call => (
                  <motion.div
                    key={call.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onCallClick(call)}
                    className={`
                      text-xs p-1 rounded cursor-pointer truncate
                      ${getStatusColor(call.status)}
                    `}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{formatSATime(call.scheduled_at)}</span>
                    </div>
                    <div className="truncate">{call.customer_name || call.customer_phone}</div>
                  </motion.div>
                ))}
                
                {calls.length > 3 && (
                  <div className="text-xs text-slate-500 text-center">
                    +{calls.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
export function WeekView({ calendarData, getCallsForDate, getStatusColor, onCallClick, currentDate }) {
  const { days } = calendarData;
  const today = new Date();
  
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-700">
        <div className="p-3 border-r border-slate-200 dark:border-slate-700"></div>
        {days.map(date => {
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={date.toISOString()} className={`
              p-3 text-center border-r border-slate-200 dark:border-slate-700
              ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800'}
            `}>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {date.toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className={`
                text-lg font-semibold
                ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}
              `}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 gap-0">
          {/* Time column */}
          <div className="border-r border-slate-200 dark:border-slate-700">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-slate-200 dark:border-slate-700 p-2 text-xs text-slate-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {days.map(date => {
            const calls = getCallsForDate(date);
            return (
              <div key={date.toISOString()} className="border-r border-slate-200 dark:border-slate-700">
                {hours.map(hour => {
                  const hourCalls = calls.filter(call => {
                    const callHour = new Date(call.scheduled_at).getHours();
                    return callHour === hour;
                  });
                  
                  return (
                    <div key={hour} className="h-16 border-b border-slate-200 dark:border-slate-700 p-1 relative">
                      {hourCalls.map((call, index) => (
                        <motion.div
                          key={call.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => onCallClick(call)}
                          className={`
                            text-xs p-1 rounded cursor-pointer mb-1 truncate
                            ${getStatusColor(call.status)}
                          `}
                          style={{ marginTop: index * 20 }}
                        >
                          <div className="font-medium truncate">
                            {call.customer_name || call.customer_phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatSATime(call.scheduled_at)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Day View Component
export function DayView({ currentDate, calls, getStatusColor, onCallClick }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="h-full flex flex-col">
      {/* Day header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {formatSADate(currentDate)}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {calls.length} {calls.length === 1 ? 'call' : 'calls'} scheduled
        </p>
      </div>
      
      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {hours.map(hour => {
            const hourCalls = calls.filter(call => {
              const callHour = new Date(call.scheduled_at).getHours();
              return callHour === hour;
            });
            
            return (
              <div key={hour} className="flex border-b border-slate-200 dark:border-slate-700 min-h-[80px]">
                <div className="w-20 p-4 text-sm text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                <div className="flex-1 p-4 space-y-2">
                  {hourCalls.map(call => (
                    <motion.div
                      key={call.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onCallClick(call)}
                      className={`
                        p-3 rounded-lg cursor-pointer border
                        ${getStatusColor(call.status)}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{call.customer_name || call.customer_phone}</h4>
                        <Badge variant="secondary">
                          {formatSATime(call.scheduled_at)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {call.customer_phone}
                        </div>
                        {call.staff_first_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {call.staff_first_name} {call.staff_last_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {call.call_type}
                        </div>
                        {call.notes && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                            {call.notes}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// List View Component
export function ListView({ calls, getStatusColor, getStatusIcon, onCallClick, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No calls scheduled</h3>
          <p className="text-slate-600 dark:text-slate-400">Schedule a call to get started</p>
        </div>
      </div>
    );
  }

  // Group calls by date
  const groupedCalls = calls.reduce((groups, call) => {
    const date = formatSADate(call.scheduled_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(call);
    return groups;
  }, {});

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
        {Object.entries(groupedCalls).map(([date, dateCalls]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 sticky top-0 bg-white dark:bg-slate-900 py-2">
              {date} ({dateCalls.length} {dateCalls.length === 1 ? 'call' : 'calls'})
            </h3>
            
            <div className="space-y-3">
              {dateCalls.map(call => (
                <motion.div
                  key={call.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => onCallClick(call)}
                  className={`
                    p-4 rounded-lg cursor-pointer border transition-all
                    ${getStatusColor(call.status)} hover:shadow-md
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-lg">
                        {call.customer_name || call.customer_phone}
                      </h4>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(call.status)}
                        <span className="text-sm capitalize">{call.status}</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline">
                      {formatSATime(call.scheduled_at)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{call.customer_phone}</span>
                    </div>
                    
                    {call.staff_first_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{call.staff_first_name} {call.staff_last_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="capitalize">{call.call_type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {call.notes && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      {call.notes}
                    </div>
                  )}
                  
                  {call.auto_generated && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        🤖 Auto-generated
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Call Detail Modal Component
export function CallDetailModal({ call, onClose, onUpdateStatus, onDelete, getStatusColor, getStatusIcon }) {
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
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Call Details
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium text-lg mb-2">
                {call.customer_name || 'Unknown Customer'}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{call.customer_phone}</span>
                </div>
                {call.customer_company && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>{call.customer_company}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Call Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                <div className={`
                  px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2
                  ${getStatusColor(call.status)}
                `}>
                  {getStatusIcon(call.status)}
                  <span className="capitalize">{call.status}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Scheduled</span>
                <span className="font-medium">
                  {formatSADate(call.scheduled_at)} at {formatSATime(call.scheduled_at)}
                </span>
              </div>
              
              {call.staff_first_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Assigned to</span>
                  <span className="font-medium">
                    {call.staff_first_name} {call.staff_last_name}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Call Type</span>
                <span className="font-medium capitalize">
                  {call.call_type?.replace('_', ' ')}
                </span>
              </div>
              
              {call.notes && (
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Notes</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                    {call.notes}
                  </div>
                </div>
              )}
              
              {call.auto_generated && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                    <span>🤖</span>
                    <span>This call was automatically generated</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-6">
            {call.status === 'scheduled' && (
              <>
                <Button
                  onClick={() => onUpdateStatus(call.id, 'completed')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                <Button
                  onClick={() => onUpdateStatus(call.id, 'missed')}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Missed
                </Button>
              </>
            )}
            
            <Button
              onClick={() => onDelete(call.id)}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
