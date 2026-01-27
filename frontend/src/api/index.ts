const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper for fetch requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

// Auth API
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
  
  login: (email: string, password: string) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  googleLogin: (credential: string) =>
    fetchWithAuth('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  
  getMe: () => fetchWithAuth('/auth/me'),
};

// Notes API
export const notesAPI = {
  getAll: () => fetchWithAuth('/notes'),
  
  create: (note: { title: string; content: string; color?: string; tags?: string[] }) =>
    fetchWithAuth('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),
  
  update: (id: string, updates: Partial<{ title: string; content: string; color: string; isPinned: boolean; tags: string[] }>) =>
    fetchWithAuth(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/notes/${id}`, { method: 'DELETE' }),
};

// Events API
export const eventsAPI = {
  getAll: () => fetchWithAuth('/events'),
  
  create: (event: { title: string; description?: string; date: string; time?: string; color?: string }) =>
    fetchWithAuth('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  
  broadcast: (event: { title: string; description?: string; date: string; time?: string; color?: string }) =>
    fetchWithAuth('/events/broadcast', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  
  update: (id: string, updates: Partial<{ title: string; description: string; date: string; time: string; color: string }>) =>
    fetchWithAuth(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/events/${id}`, { method: 'DELETE' }),
};

// Profile API
export const profileAPI = {
  getPublic: (username: string) => fetchWithAuth(`/profile/${username}`),
  
  update: (profile: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
    socialLinks?: Record<string, string>;
    theme?: 'dark' | 'paper';
  }) =>
    fetchWithAuth('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  completeOnboarding: (data: {
    displayName: string;
    username: string;
    gender: string;
    bio: string;
    socialLinks?: Record<string, string>;
  }) =>
    fetchWithAuth('/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// CGPA API
export const cgpaAPI = {
  getArchive: () => fetchWithAuth('/cgpa/archive'),
  
  saveToArchive: (record: {
    semester: string;
    courses: Array<{ name: string; credits: number; grade: string; gradePoints: number }>;
    sgpa: number;
    cgpa: number;
    totalCredits: number;
  }) =>
    fetchWithAuth('/cgpa/archive', {
      method: 'POST',
      body: JSON.stringify(record),
    }),
  
  deleteFromArchive: (id: string) =>
    fetchWithAuth(`/cgpa/archive/${id}`, { method: 'DELETE' }),
};

// Timetable API
export const timetableAPI = {
  // Settings
  getSettings: () => fetchWithAuth('/timetable/settings'),
  updateSettings: (settings: {
    attendanceThreshold?: number;
    activeSemester?: number;
    weekendSettings?: {
      saturdayEnabled?: boolean;
      sundayEnabled?: boolean;
      saturdayMapsTo?: number | null;
      sundayMapsTo?: number | null;
    };
    semesterStartDate?: string | null;
    semesterEndDate?: string | null;
  }) =>
    fetchWithAuth('/timetable/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Courses
  getCourses: (semester?: number) =>
    fetchWithAuth(`/timetable/courses${semester ? `?semester=${semester}` : ''}`),
  
  createCourse: (course: {
    name: string;
    code: string;
    venue: string;
    credits: number;
    semester: number;
    color?: string;
  }) =>
    fetchWithAuth('/timetable/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),
  
  updateCourse: (id: string, updates: Partial<{
    name: string;
    code: string;
    venue: string;
    credits: number;
    color: string;
  }>) =>
    fetchWithAuth(`/timetable/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  deleteCourse: (id: string) =>
    fetchWithAuth(`/timetable/courses/${id}`, { method: 'DELETE' }),

  // Slots
  getSlots: (semester?: number) =>
    fetchWithAuth(`/timetable/slots${semester ? `?semester=${semester}` : ''}`),
  
  createSlot: (slot: {
    courseId: string;
    semester: number;
    day: number;
    startTime: string;
    endTime: string;
  }) =>
    fetchWithAuth('/timetable/slots', {
      method: 'POST',
      body: JSON.stringify(slot),
    }),
  
  updateSlot: (id: string, updates: Partial<{
    day: number;
    startTime: string;
    endTime: string;
  }>) =>
    fetchWithAuth(`/timetable/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  deleteSlot: (id: string) =>
    fetchWithAuth(`/timetable/slots/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params?: { courseId?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.courseId) query.set('courseId', params.courseId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return fetchWithAuth(`/timetable/attendance?${query.toString()}`);
  },
  
  markAttendance: (data: {
    slotId: string;
    courseId: string;
    date: string;
    status: 'attended' | 'missed' | 'cancelled';
  }) =>
    fetchWithAuth('/timetable/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getAttendanceStats: (semester: number) =>
    fetchWithAuth(`/timetable/attendance/stats?semester=${semester}`),
};

