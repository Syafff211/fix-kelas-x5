'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

// ========== STUDENTS ==========
export function useStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name');
    if (!error && data) setStudents(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const addStudent = async (student: any) => {
    // Create auth user first via Supabase admin
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...student, role: 'student' }])
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Siswa berhasil ditambahkan!');
    fetchStudents();
    return data;
  };

  const updateStudent = async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Siswa berhasil diupdate!');
    fetchStudents();
    return data;
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Siswa berhasil dihapus!');
    fetchStudents();
    return true;
  };

  return { students, loading, addStudent, updateStudent, deleteStudent, refetch: fetchStudents };
}

// ========== ATTENDANCE ==========
export function useAttendance(studentId?: string) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('attendance').select('*, profiles(full_name, nisn)').order('date', { ascending: false });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (!error && data) setAttendance(data);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const submitAttendance = async (record: any) => {
    const { data, error } = await supabase
      .from('attendance')
      .upsert([record], { onConflict: 'student_id,date' })
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Absensi berhasil disimpan!');
    fetchAttendance();
    return data;
  };

  const bulkSubmitAttendance = async (records: any[]) => {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();
    if (error) { toast.error(error.message); return null; }
    toast.success(`${records.length} absensi berhasil disimpan!`);
    fetchAttendance();
    return data;
  };

  return { attendance, loading, submitAttendance, bulkSubmitAttendance, refetch: fetchAttendance };
}

// ========== ASSIGNMENTS ==========
export function useAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .select('*, assignment_submissions(*)')
      .order('due_date', { ascending: false });
    if (!error && data) setAssignments(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const addAssignment = async (assignment: any) => {
    const { data, error } = await supabase
      .from('assignments')
      .insert([assignment])
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Tugas berhasil dibuat!');
    fetchAssignments();
    return data;
  };

  const updateAssignment = async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Tugas berhasil diupdate!');
    fetchAssignments();
    return data;
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Tugas berhasil dihapus!');
    fetchAssignments();
    return true;
  };

  return { assignments, loading, addAssignment, updateAssignment, deleteAssignment, refetch: fetchAssignments };
}

// ========== GRADES ==========
export function useGrades(studentId?: string) {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('grades').select('*, profiles(full_name, nisn)').order('created_at', { ascending: false });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (!error && data) setGrades(data);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const addGrade = async (grade: any) => {
    const { data, error } = await supabase.from('grades').insert([grade]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Nilai berhasil ditambahkan!');
    fetchGrades();
    return data;
  };

  const updateGrade = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Nilai berhasil diupdate!');
    fetchGrades();
    return data;
  };

  const deleteGrade = async (id: string) => {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Nilai berhasil dihapus!');
    fetchGrades();
    return true;
  };

  return { grades, loading, addGrade, updateGrade, deleteGrade, refetch: fetchGrades };
}

// ========== ANNOUNCEMENTS ==========
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const addAnnouncement = async (announcement: any) => {
    const { data, error } = await supabase.from('announcements').insert([announcement]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Pengumuman berhasil dibuat!');
    fetchAnnouncements();
    return data;
  };

  const updateAnnouncement = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('announcements').update(updates).eq('id', id).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Pengumuman berhasil diupdate!');
    fetchAnnouncements();
    return data;
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Pengumuman berhasil dihapus!');
    fetchAnnouncements();
    return true;
  };

  return { announcements, loading, addAnnouncement, updateAnnouncement, deleteAnnouncement, refetch: fetchAnnouncements };
}

// ========== MATERIALS ==========
export function useMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (!error && data) setMaterials(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const addMaterial = async (material: any) => {
    const { data, error } = await supabase.from('materials').insert([material]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Materi berhasil ditambahkan!');
    fetchMaterials();
    return data;
  };

  const updateMaterial = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('materials').update(updates).eq('id', id).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Materi berhasil diupdate!');
    fetchMaterials();
    return data;
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Materi berhasil dihapus!');
    fetchMaterials();
    return true;
  };

  return { materials, loading, addMaterial, updateMaterial, deleteMaterial, refetch: fetchMaterials };
}

// ========== GALLERY ==========
export function useGallery() {
  const [items, setItems] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    const [itemsRes, albumsRes] = await Promise.all([
      supabase.from('gallery').select('*, gallery_albums(name)').order('created_at', { ascending: false }),
      supabase.from('gallery_albums').select('*').order('created_at', { ascending: false }),
    ]);
    if (!itemsRes.error && itemsRes.data) setItems(itemsRes.data);
    if (!albumsRes.error && albumsRes.data) setAlbums(albumsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const addItem = async (item: any) => {
    const { data, error } = await supabase.from('gallery').insert([item]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Item galeri berhasil ditambahkan!');
    fetchGallery();
    return data;
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Item galeri berhasil dihapus!');
    fetchGallery();
    return true;
  };

  const addAlbum = async (album: any) => {
    const { data, error } = await supabase.from('gallery_albums').insert([album]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Album berhasil dibuat!');
    fetchGallery();
    return data;
  };

  const deleteAlbum = async (id: string) => {
    const { error } = await supabase.from('gallery_albums').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Album berhasil dihapus!');
    fetchGallery();
    return true;
  };

  return { items, albums, loading, addItem, deleteItem, addAlbum, deleteAlbum, refetch: fetchGallery };
}

// ========== CALENDAR EVENTS ==========
export function useCalendarEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('calendar_events').select('*').order('date', { ascending: false });
    if (!error && data) setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const addEvent = async (event: any) => {
    const { data, error } = await supabase.from('calendar_events').insert([event]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Event berhasil ditambahkan!');
    fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('calendar_events').update(updates).eq('id', id).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Event berhasil diupdate!');
    fetchEvents();
    return data;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Event berhasil dihapus!');
    fetchEvents();
    return true;
  };

  return { events, loading, addEvent, updateEvent, deleteEvent, refetch: fetchEvents };
}

// ========== FILE UPLOAD ==========
export function useFileUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, path?: string): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    const fileName = path || `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });
    setUploading(false);
    if (error) { toast.error(error.message); return null; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    toast.success('File berhasil diupload!');
    return urlData.publicUrl;
  };

  const deleteFile = async (path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  return { uploadFile, deleteFile, uploading, progress };
}

// ========== NOTIFICATIONS ==========
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (!error && data) setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const sendNotification = async (notification: any) => {
    const { data, error } = await supabase.from('notifications').insert([notification]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Notifikasi berhasil dikirim!');
    fetchNotifications();
    return data;
  };

  const broadcastNotification = async (title: string, message: string, type = 'info') => {
    // Send to all users (user_id = null means global)
    const { data, error } = await supabase.from('notifications').insert([{
      title, message, type, user_id: null
    }]).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Broadcast berhasil dikirim ke semua siswa!');
    fetchNotifications();
    return data;
  };

  return { notifications, loading, sendNotification, broadcastNotification, refetch: fetchNotifications };
}

// ========== LANDING CMS ==========
export function useLandingCMS() {
  const [content, setContent] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const [contentRes, settingsRes] = await Promise.all([
      supabase.from('landing_content').select('*'),
      supabase.from('website_settings').select('*'),
    ]);
    if (!contentRes.error && contentRes.data) setContent(contentRes.data);
    if (!settingsRes.error && settingsRes.data) setSettings(settingsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const updateContent = async (section: string, key: string, value: string, valueType = 'text') => {
    const { data, error } = await supabase
      .from('landing_content')
      .upsert({ section, key, value, value_type: valueType }, { onConflict: 'section,key' })
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Konten berhasil disimpan!');
    fetchContent();
    return data;
  };

  const updateSetting = async (key: string, value: string, category: string) => {
    const { data, error } = await supabase
      .from('website_settings')
      .upsert({ key, value, category }, { onConflict: 'key' })
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Pengaturan berhasil disimpan!');
    fetchContent();
    return data;
  };

  return { content, settings, loading, updateContent, updateSetting, refetch: fetchContent };
}
