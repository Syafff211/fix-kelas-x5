'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Edit, Trash2, X, Calendar, Clock, Save, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAssignments } from '@/hooks/useSupabase';
import { useAuthStore } from '@/store';

export default function AdminAssignmentsPage() {
  const { assignments, loading, addAssignment, updateAssignment, deleteAssignment } = useAssignments();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', due_date: '' });

  const openAdd = () => { setEditing(null); setForm({ title: '', description: '', subject: '', due_date: '' }); setShowModal(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ title: a.title, description: a.description, subject: a.subject || '', due_date: a.due_date?.split('T')[0] || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.due_date) return;
    const payload = { ...form, due_date: new Date(form.due_date).toISOString(), created_by: user?.id };
    if (editing) { await updateAssignment(editing.id, payload); }
    else { await addAssignment(payload); }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kelola Tugas</h1>
          <p className="text-muted-foreground">Total: {assignments.length} tugas</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Buat Tugas Baru</Button>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><div className="h-40 skeleton rounded-xl" /></CardContent></Card>)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {assignments.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:glow-primary transition-all h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {a.subject && <Badge variant="outline" className="mb-2">{a.subject}</Badge>}
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(a.due_date).toLocaleDateString('id-ID')}</div>
                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{a.assignment_submissions?.length || 0} submit</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(a)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => { if(confirm('Hapus tugas ini?')) deleteAssignment(a.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editing ? 'Edit Tugas' : 'Buat Tugas Baru'}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Judul Tugas *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Contoh: Essay Bahasa Indonesia" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Mata Pelajaran</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Matematika" /></div>
                  <div className="space-y-2"><Label>Deadline *</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Deskripsi *</Label><textarea className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi tugas..." /></div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1"><Save className="h-4 w-4 mr-2" />{editing ? 'Simpan' : 'Buat Tugas'}</Button>
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
