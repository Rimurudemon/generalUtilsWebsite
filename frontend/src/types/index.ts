export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  profile: UserProfile;
  stats: UserStats;
}

export interface UserProfile {
  displayName: string;
  bio: string;
  avatar: string;
  location: string;
  website: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    github: string;
    linkedin: string;
    youtube: string;
  };
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
