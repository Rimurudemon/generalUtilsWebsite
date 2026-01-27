export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isOnboarded: boolean;
  profile: UserProfile;
  stats: UserStats;
}

export interface UserProfile {
  displayName: string;
  bio: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  avatar: string;
  location: string;
  website: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    github: string;
    linkedin: string;
    youtube: string;
    discord: string;
  };
  customLinks: Array<{
    title: string;
    url: string;
    isActive: boolean;
  }>;
  theme: 'dark' | 'paper';
}

export interface UserStats {
  pdfCompressed: number;
  imagesConverted: number;
  notesCreated: number;
  eventsCreated: number;
  cgpaCalculations: number;
}

export interface Note {
  _id: string;
  user: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  _id: string;
  user: string;
  title: string;
  description: string;
  date: string;
  time: string;
  color: string;
  isBroadcast: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
  gradePoints: number;
}

export interface CgpaRecord {
  _id: string;
  user: string;
  semester: string;
  courses: Array<{
    name: string;
    credits: number;
    grade: string;
    gradePoints: number;
  }>;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  createdAt: string;
}

// Timetable Types
export interface TimetableCourse {
  _id: string;
  user: string;
  semester: number;
  name: string;
  code: string;
  venue: string;
  credits: number;
  color: string;
  attendanceThreshold?: number;
  createdAt: string;
}

export interface TimetableSlot {
  _id: string;
  user: string;
  course: TimetableCourse;
  semester: number;
  day: number; // 0 = Monday, 6 = Sunday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  user: string;
  slot: TimetableSlot;
  course: TimetableCourse;
  date: string;
  status: 'attended' | 'missed' | 'cancelled';
  createdAt: string;
}

export interface TimetableSettings {
  _id: string;
  user: string;
  attendanceThreshold: number;
  activeSemester: number;
  weekendSettings: {
    saturdayEnabled: boolean;
    sundayEnabled: boolean;
    saturdayMapsTo: number | null;
    sundayMapsTo: number | null;
  };
  semesterStartDate: string | null;
  semesterEndDate: string | null;
  updatedAt: string;
}

export interface AttendanceStats {
  course: TimetableCourse;
  attended: number;
  missed: number;
  cancelled: number;
  total: number;
  percentage: number;
  allowedLeaves: number;
  leavesUsed: number;
  leavesRemaining: number;
}

