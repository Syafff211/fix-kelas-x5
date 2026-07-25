'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCalendarEvents } from '@/hooks/useSupabase';
import { toast } from 'sonner';

export default function AdminCalendarPage() {
  const { events, loading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', end_date: '', time: '', type: 'event', color: '#6366f1' });

  const types = [
    { value: 'holiday', label: 'Libur', color: 'text-success', badge: 'success' as const },
    { value: 'exam', label: 'Ujian', color: 'text-destructive', badge: 'error' as const },
    { value: 'event', label: 'Event', color: 'text-primary', badge: 'default' as const },
    { value: 'meeting', label: 'Rapat', color: 'text-info', badge: 'info' as const },
    { value: 'other', label: 'Lainnya', color: 'text-muted-foreground', badge: 'outline' as const },
  ];

  const openAdd = () => { setEditing(null); setForm({ title: '', description: '', date: '', end_date: '', time: '', type: 'event', color: '#6366f1' }); setShowModal(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ title: e.title, description: e.description || '', date: e.date, end_date: e.end_date || '', time: e.time || '', type: e.type, color: e.color || '#6366f1' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Judul dan tanggal wajib diisi!'); return; }
    const payload = { ...form, end_date: form.end_date || null, time: form.time || null };
    if (editing) { await updateEvent(editing.id, payload); }
    else { await addEvent(payload); }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kelola Kalender</h1>
          <p className="text-muted-foreground">{events.length} event</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Tambah Event</Button>
      </motion.div>

      <div className="space-y-3">
        {events.map((event, i) => {
          const typeInfo = types.find(t => t.value === event.type) || types[4];
          return (
            <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:glow-primary transition-all">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: `${event.color || '#6366f1'}20` }}>
                      <span className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                      <span className="text-lg font-bold" style={{ color: event.color || '#6366f1' }}>{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge variant={typeInfo.badge}>{typeInfo.label}</Badge>
                      </div>
                      {event.description && <p className="text-sm text-muted-foreground truncate">{event.description}</p>}
                      {event.time && <p className="text-xs text-muted-foreground">⏰ {event.time}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if(confirm('Hapus event?')) deleteEvent(event.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {events.length === 0 && !loading && (
        <Card><CardContent className="pt-6 text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada event</p>
        </CardContent></Card>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editing ? 'Edit' : 'Tambah'} Event</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Judul *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tanggal *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Sampai Tanggal</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Waktu</Label><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Deskripsi</Label><textarea className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1"><Save className="h-4 w-4 mr-2" />Simpan</Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
