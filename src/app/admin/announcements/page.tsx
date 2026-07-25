'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Edit, Trash2, X, Pin, Save, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAnnouncements, useStudents } from '@/hooks/useSupabase';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function AdminAnnouncementsPage() {
  const { announcements, loading, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { students } = useStudents();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', is_pinned: false });
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ title: '', content: '', is_pinned: false }); setShowModal(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ title: a.title, content: a.content, is_pinned: a.is_pinned }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error('Judul dan konten wajib diisi!'); return; }
    const payload = { ...form, created_by: user?.id };
    if (editing) { await updateAnnouncement(editing.id, payload); }
    else { await addAnnouncement(payload); }
    setShowModal(false);
  };

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) { 
      toast.error('Judul dan pesan wajib diisi!'); 
      return; 
    }

    setSending(true);
    try {
      // Create notification for each student
      const notifications = students.map(student => ({
        user_id: student.id,
        title: broadcast.title,
        message: broadcast.message,
        type: 'info' as const,
        is_read: false,
      }));

      // Also create a global notification (user_id = null)
      notifications.push({
        user_id: null as any,
        title: broadcast.title,
        message: broadcast.message,
        type: 'info' as const,
        is_read: false,
      });

      // Insert all notifications
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast.success(`Broadcast berhasil dikirim ke ${students.length} siswa!`);
      setShowBroadcast(false);
      setBroadcast({ title: '', message: '' });
    } catch (error: any) {
      console.error('Broadcast error:', error);
      toast.error('Gagal mengirim broadcast: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const togglePin = async (a: any) => {
    await updateAnnouncement(a.id, { is_pinned: !a.is_pinned });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Pengumuman</h1>
          <p className="text-muted-foreground">Total: {announcements.length} pengumuman</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBroadcast(true)}>
            <Megaphone className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Pengumuman
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-24 skeleton rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:glow-primary transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{a.title}</h3>
                        {a.is_pinned && (
                          <Badge variant="warning" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{a.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => togglePin(a)}>
                        <Pin className={`h-4 w-4 ${a.is_pinned ? 'text-warning' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Hapus pengumuman ini?')) {
                            deleteAnnouncement(a.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editing ? 'Edit' : 'Buat'} Pengumuman
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konten *</Label>
                  <textarea
                    className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none"
                    rows={5}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="rounded border-white/10"
                  />
                  <span className="text-sm">Pin pengumuman ini</span>
                </label>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Broadcast Notifikasi
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowBroadcast(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Kirim notifikasi ke <strong>SEMUA {students.length} siswa</strong> sekaligus.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul *</Label>
                  <Input
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                    placeholder="Contoh: Pengumuman Penting"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pesan *</Label>
                  <textarea
                    className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none"
                    rows={4}
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                    placeholder="Tulis pesan broadcast..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleBroadcast} className="flex-1" disabled={sending}>
                    <Megaphone className="h-4 w-4 mr-2" />
                    {sending ? 'Mengirim...' : 'Kirim Broadcast'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowBroadcast(false)} disabled={sending}>
                    Batal
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
