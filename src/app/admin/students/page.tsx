'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Edit, Trash2, Crown, X, Download, Upload, UserPlus, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStudents } from '@/hooks/useSupabase';
import { toast } from 'sonner';

export default function AdminStudentsPage() {
  const { students, loading, addStudent, updateStudent, deleteStudent, refetch } = useStudents();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', nisn: '', phone: '', address: '', parent_name: '', class_position: '' });

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn?.includes(search) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingStudent(null);
    setFormData({ full_name: '', email: '', password: '', nisn: '', phone: '', address: '', parent_name: '', class_position: '' });
    setShowModal(true);
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name || '',
      email: student.email || '',
      nisn: student.nisn || '',
      phone: student.phone || '',
      address: student.address || '',
      parent_name: student.parent_name || '',
      class_position: student.class_position || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Nama dan email wajib diisi!');
      return;
    }

    // Validasi password untuk student baru
    if (!editingStudent && !formData.password) {
      toast.error('Password wajib diisi untuk student baru!');
      return;
    }

    if (!editingStudent && formData.password && formData.password.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }

    if (editingStudent) {
      // Edit existing student
      await updateStudent(editingStudent.id, {
        full_name: formData.full_name,
        email: formData.email,
        nisn: formData.nisn,
        phone: formData.phone,
        address: formData.address,
        parent_name: formData.parent_name,
        class_position: formData.class_position,
      });
    } else {
      // Create new student via API
      try {
        console.log('Creating student with data:', {
          email: formData.email,
          full_name: formData.full_name,
          hasPassword: !!formData.password,
        });

        const response = await fetch('/api/admin/create-student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            nisn: formData.nisn || null,
            phone: formData.phone || null,
            address: formData.address || null,
            parent_name: formData.parent_name || null,
            class_position: formData.class_position || null,
          }),
        });

        console.log('Response status:', response.status);

        let result;
        try {
          result = await response.json();
          console.log('Response data:', result);
        } catch (e) {
          console.error('Failed to parse response:', e);
          throw new Error('Server returned invalid response');
        }

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Gagal membuat student');
        }

        toast.success(`Student ${result.data.full_name} berhasil ditambahkan!`);
        setShowModal(false);
        setFormData({ full_name: '', email: '', password: '', nisn: '', phone: '', address: '', parent_name: '', class_position: '' });
        refetch();
      } catch (error: any) {
        console.error('Create student error:', error);
        toast.error(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus siswa "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      await deleteStudent(id);
    }
  };

  const positions = ['Ketua Kelas', 'Wakil Ketua', 'Sekretaris', 'Bendahara'];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Siswa</h1>
          <p className="text-muted-foreground">Total: {students.length} siswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button onClick={openAdd}><UserPlus className="h-4 w-4 mr-2" />Tambah Siswa</Button>
        </div>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama, NISN, atau email..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}><CardContent className="pt-6"><div className="h-32 skeleton rounded-xl" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((student, i) => (
              <motion.div key={student.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:glow-primary transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                        {student.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{student.full_name}</h3>
                          {student.class_position && (
                            <Badge variant="default" className="gap-1 shrink-0 text-[10px]">
                              <Crown className="h-3 w-3" />{student.class_position}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">NISN: {student.nisn || '-'}</p>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                        {student.phone && <p className="text-xs text-muted-foreground">📱 {student.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(student)}>
                        <Edit className="h-4 w-4 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(student.id, student.full_name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <Card><CardContent className="pt-6 text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Tidak ada siswa ditemukan</p>
        </CardContent></Card>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap *</Label>
                    <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Nama lengkap" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  {!editingStudent && (
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input 
                        type="password" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="Minimal 6 karakter" 
                      />
                      <p className="text-xs text-muted-foreground">Password untuk login student</p>
                    </div>
                  )}
                  {editingStudent && (
                    <div className="space-y-2 col-span-2">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-400">
                          💡 Untuk mengubah password, student harus melakukannya sendiri melalui halaman profile mereka.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>NISN</Label>
                    <Input value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Telepon</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Orang Tua</Label>
                    <Input value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} placeholder="Nama orang tua" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jabatan Kelas</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={formData.class_position} onChange={e => setFormData({...formData, class_position: e.target.value})}>
                      <option value="">Tidak ada</option>
                      {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <textarea className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat lengkap" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1">{editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}</Button>
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
