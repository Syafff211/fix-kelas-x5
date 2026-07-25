'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

interface OrganizationMember {
  id?: string;
  position: string;
  name: string;
  description?: string;
  order: number;
}

export default function AdminOrganizationPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_content')
        .select('value')
        .eq('section', 'organization')
        .eq('key', 'members')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.value) {
        setMembers(JSON.parse(data.value));
      } else {
        // Default structure
        setMembers([
          { position: 'Ketua Kelas', name: '', description: '', order: 1 },
          { position: 'Wakil Ketua', name: '', description: '', order: 2 },
          { position: 'Sekretaris', name: '', description: '', order: 3 },
          { position: 'Bendahara', name: '', description: '', order: 4 },
        ]);
      }
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      toast.error('Gagal memuat struktur organisasi');
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setMembers([
      ...members,
      {
        position: 'Posisi Baru',
        name: '',
        description: '',
        order: members.length + 1,
      },
    ]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof OrganizationMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const saveOrganization = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('landing_content').upsert(
        {
          section: 'organization',
          key: 'members',
          value: JSON.stringify(members),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'section,key' }
      );

      if (error) throw error;

      toast.success('Struktur organisasi berhasil disimpan!');
      setEditing(false);
    } catch (error: any) {
      console.error('Error saving organization:', error);
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            Struktur Organisasi
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengurus kelas yang ditampilkan di landing page
          </p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button onClick={saveOrganization} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {members.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant={index === 0 ? 'primary' : 'outline'}>
                        #{member.order}
                      </Badge>
                      {editing ? (
                        <Input
                          value={member.position}
                          onChange={(e) => updateMember(index, 'position', e.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        <span>{member.position}</span>
                      )}
                    </CardTitle>
                    {editing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      {editing ? (
                        <Input
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          placeholder="Nama lengkap"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white/5 rounded-lg">
                          {member.name || <span className="text-muted-foreground">Belum diisi</span>}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Deskripsi (Opsional)</Label>
                      {editing ? (
                        <Input
                          value={member.description || ''}
                          onChange={(e) => updateMember(index, 'description', e.target.value)}
                          placeholder="Kelas X-5, NISN: 1234567890"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white/5 rounded-lg">
                          {member.description || <span className="text-muted-foreground">-</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {editing && (
        <Button onClick={addMember} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Posisi
        </Button>
      )}

      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Users className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                <li>Posisi akan ditampilkan di landing page sesuai urutan</li>
                <li>Klik "Tambah Posisi" untuk menambah jabatan baru</li>
                <li>Deskripsi bisa diisi dengan kelas, NISN, atau informasi lain</li>
                <li>Perubahan akan langsung muncul di landing page setelah disimpan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
