// Staff color assignments
export const STAFF_COLORS = {
  'teststaff': {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    light: 'bg-emerald-100',
    dark: 'bg-emerald-900',
    textLight: 'text-emerald-700',
    textDark: 'text-emerald-300'
  },
  'admin': {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    light: 'bg-blue-100',
    dark: 'bg-blue-900',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300'
  },
  'manager': {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    light: 'bg-purple-100',
    dark: 'bg-purple-900',
    textLight: 'text-purple-700',
    textDark: 'text-purple-300'
  },
  'staff1': {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    light: 'bg-orange-100',
    dark: 'bg-orange-900',
    textLight: 'text-orange-700',
    textDark: 'text-orange-300'
  },
  'staff2': {
    bg: 'bg-pink-500',
    text: 'text-pink-600',
    light: 'bg-pink-100',
    dark: 'bg-pink-900',
    textLight: 'text-pink-700',
    textDark: 'text-pink-300'
  }
};

export const getStaffColor = (staffUsername) => {
  return STAFF_COLORS[staffUsername] || {
    bg: 'bg-slate-500',
    text: 'text-slate-600',
    light: 'bg-slate-100',
    dark: 'bg-slate-900',
    textLight: 'text-slate-700',
    textDark: 'text-slate-300'
  };
};