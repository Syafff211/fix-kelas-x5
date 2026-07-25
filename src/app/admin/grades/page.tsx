'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Edit, Trash2, X, Save, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGrades, useStudents } from '@/hooks/useSupabase';
import { toast } from 'sonner';

export default function AdminGradesPage() {
  const { grades, loading, addGrade, updateGrade, deleteGrade } = useGrades();
  const { students } = useStudents();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ student_id: '', subject: '', type: 'daily', score: '', semester: '1', academic_year: '2024/2025', note: '' });
  const [filterStudent, setFilterStudent] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const subjects = ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'PKN', 'Penjas', 'Seni Budaya', 'TIK'];
  const types = [
    { value: 'daily', label: 'Harian' },
    { value: 'assignment', label: 'Tugas' },
    { value: 'mid_semester', label: 'UTS' },
    { value: 'final_semester', label: 'UAS' },
  ];

  const openAdd = () => { setEditing(null); setForm({ student_id: '', subject: '', type: 'daily', score: '', semester: '1', academic_year: '2024/2025', note: '' }); setShowModal(true); };
  const openEdit = (g: any) => { setEditing(g); setForm({ student_id: g.student_id, subject: g.subject, type: g.type, score: g.score.toString(), semester: g.semester.toString(), academic_year: g.academic_year, note: g.note || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.student_id || !form.subject || !form.score) { toast.error('Semua field wajib diisi!'); return; }
    const score = parseInt(form.score);
    if (score < 0 || score > 100) { toast.error('Nilai harus antara 0-100!'); return; }
    const payload = { ...form, score, semester: parseInt(form.semester) };
    if (editing) { await updateGrade(editing.id, payload); }
    else { await addGrade(payload); }
    setShowModal(false);
  };

  const filtered = grades.filter(g => {
    if (filterStudent && g.student_id !== filterStudent) return false;
    if (filterSubject && g.subject !== filterSubject) return false;
    return true;
  });

  const getStudentName = (id: string) => students.find(s => s.id === id)?.full_name || '-';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Nilai</h1>
          <p className="text-muted-foreground">Total: {grades.length} nilai</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Input Nilai</Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filter Siswa</Label>
              <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
                <option value="">Semua Siswa</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Filter Mapel</Label>
              <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                <option value="">Semua Mapel</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Siswa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mapel</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Jenis</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Nilai</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Smt</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={g.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-sm font-medium">{getStudentName(g.student_id)}</td>
                    <td className="py-3 px-4 text-sm">{g.subject}</td>
                    <td className="py-3 px-4 text-center"><Badge variant="outline">{types.find(t => t.value === g.type)?.label || g.type}</Badge></td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-lg font-bold ${g.score >= 85 ? 'text-success' : g.score >= 70 ? 'text-warning' : 'text-destructive'}`}>{g.score}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm">{g.semester}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if(confirm('Hapus nilai ini?')) deleteGrade(g.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Belum ada data nilai</p>}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editing ? 'Edit' : 'Input'} Nilai</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Siswa *</Label>
                  <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                    <option value="">Pilih Siswa</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.nisn || '-'})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mata Pelajaran *</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                      <option value="">Pilih Mapel</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Nilai *</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Nilai (0-100) *</Label><Input type="number" min="0" max="100" value={form.score} onChange={e => setForm({...form, score: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Catatan</Label><Input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Catatan tambahan (opsional)" /></div>
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
