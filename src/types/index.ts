export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  nisn?: string;
  phone?: string;
  email: string;
  address?: string;
  parent_name?: string;
  avatar_url?: string;
  role: 'admin' | 'student';
  created_at: string;
  updated_at: string;
}

export interface Student extends Profile {
  class_position?: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'permission' | 'sick' | 'absent';
  note?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  files?: AttendanceFile[];
}

export interface AttendanceFile {
  id: string;
  attendance_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject?: string;
  due_date: string;
  file_url?: string;
  file_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  file_name?: string;
  content?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  student?: Student;
}

export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  type: 'daily' | 'assignment' | 'mid_semester' | 'final_semester';
  score: number;
  semester: number;
  academic_year: string;
  note?: string;
  created_at: string;
  student?: Student;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  external_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  is_pinned: boolean;
  scheduled_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  album_id?: string;
  title: string;
  description?: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_featured: boolean;
  created_at: string;
  album?: GalleryAlbum;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  created_at: string;
  items?: GalleryItem[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  time?: string;
  type: 'holiday' | 'exam' | 'event' | 'meeting' | 'other';
  color?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface LandingContent {
  id: string;
  section: string;
  key: string;
  value: string;
  value_type: 'text' | 'html' | 'json' | 'image_url';
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: Profile;
}
