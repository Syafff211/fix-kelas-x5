'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Edit, Trash2, X, Save, Upload, ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMaterials, useFileUpload } from '@/hooks/useSupabase';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

export default function AdminMaterialsPage() {
  const { materials, loading, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
  const { uploadFile, uploading } = useFileUpload('materials');
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', external_url: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState('');

  const categories = ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'PKN', 'Lainnya'];

  const openAdd = () => { setEditing(null); setForm({ title: '', description: '', category: '', external_url: '' }); setSelectedFile(null); setShowModal(true); };
  const openEdit = (m: any) => { setEditing(m); setForm({ title: m.title, description: m.description || '', category: m.category, external_url: m.external_url || '' }); setSelectedFile(null); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.category) { toast.error('Judul dan kategori wajib diisi!'); return; }
    let fileUrl = null, fileName = null, fileType = null, fileSize = null;
    if (selectedFile) {
      fileUrl = await uploadFile(selectedFile);
      if (fileUrl) { fileName = selectedFile.name; fileType = selectedFile.type; fileSize = selectedFile.size; }
    }
    const payload = { ...form, file_url: fileUrl, file_name: fileName, file_type: fileType, file_size: fileSize, external_url: form.external_url || null, created_by: user?.id };
    if (editing) { await updateMaterial(editing.id, payload); }
    else { await addMaterial(payload); }
    setShowModal(false);
  };

  const filtered = filterCategory ? materials.filter(m => m.category === filterCategory) : materials;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Materi</h1>
          <p className="text-muted-foreground">Total: {materials.length} materi</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Tambah Materi</Button>
      </motion.div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={!filterCategory ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory('')}>Semua</Button>
        {categories.map(c => <Button key={c} variant={filterCategory === c ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory(c)}>{c}</Button>)}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="h-full hover:glow-primary transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
                  <Badge variant="outline">{m.category}</Badge>
                </div>
                <CardTitle className="text-base mt-3">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {m.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{m.description}</p>}
                <div className="flex items-center gap-2 mb-3">
                  {m.file_url && <Badge variant="info">File</Badge>}
                  {m.external_url && <Badge variant="success">Link</Badge>}
                  {m.file_size && <span className="text-xs text-muted-foreground">{(m.file_size / 1024 / 1024).toFixed(1)} MB</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(m)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => { if(confirm('Hapus materi?')) deleteMaterial(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editing ? 'Edit' : 'Tambah'} Materi</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Judul *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Kategori *</Label>
                  <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Deskripsi</Label><textarea className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-2">
                    <input type="file" className="hidden" id="material-file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                    <label htmlFor="material-file" className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/50 cursor-pointer text-sm">
                      <Upload className="h-4 w-4" />
                      {selectedFile ? selectedFile.name : 'Pilih file'}
                    </label>
                  </div>
                </div>
                <div className="space-y-2"><Label>Atau URL External (Google Drive, dll)</Label><Input value={form.external_url} onChange={e => setForm({...form, external_url: e.target.value})} placeholder="https://drive.google.com/..." /></div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1" disabled={uploading}><Save className="h-4 w-4 mr-2" />{uploading ? 'Uploading...' : 'Simpan'}</Button>
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
