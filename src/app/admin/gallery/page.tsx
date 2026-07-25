'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Trash2, X, Upload, FolderPlus, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGallery, useFileUpload } from '@/hooks/useSupabase';
import { toast } from 'sonner';

export default function AdminGalleryPage() {
  const { items, albums, loading, addItem, deleteItem, addAlbum, deleteAlbum } = useGallery();
  const { uploadFile, uploading } = useFileUpload('gallery');
  const [showUpload, setShowUpload] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', album_id: '', media_type: 'image' as 'image' | 'video' });
  const [albumForm, setAlbumForm] = useState({ name: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filterAlbum, setFilterAlbum] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!uploadForm.title || selectedFiles.length === 0) { toast.error('Judul dan file wajib diisi!'); return; }
    for (const file of selectedFiles) {
      const url = await uploadFile(file);
      if (url) {
        await addItem({
          title: uploadForm.title,
          description: uploadForm.description || null,
          media_url: url,
          media_type: uploadForm.media_type,
          album_id: uploadForm.album_id || null,
        });
      }
    }
    setShowUpload(false);
    setSelectedFiles([]);
    setUploadForm({ title: '', description: '', album_id: '', media_type: 'image' });
  };

  const handleAddAlbum = async () => {
    if (!albumForm.name) { toast.error('Nama album wajib diisi!'); return; }
    await addAlbum(albumForm);
    setShowAlbum(false);
    setAlbumForm({ name: '', description: '' });
  };

  const filteredItems = filterAlbum ? items.filter(i => i.album_id === filterAlbum) : items;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Galeri</h1>
          <p className="text-muted-foreground">{items.length} foto/video • {albums.length} album</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAlbum(true)}><FolderPlus className="h-4 w-4 mr-2" />Album Baru</Button>
          <Button onClick={() => setShowUpload(true)}><Upload className="h-4 w-4 mr-2" />Upload</Button>
        </div>
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!filterAlbum ? 'default' : 'outline'} size="sm" onClick={() => setFilterAlbum('')}>Semua</Button>
        {albums.map(a => (
          <Button key={a.id} variant={filterAlbum === a.id ? 'default' : 'outline'} size="sm" onClick={() => setFilterAlbum(a.id)}>{a.name}</Button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="group relative">
            <Card className="overflow-hidden hover:glow-primary transition-all">
              <div className="aspect-square relative bg-gradient-to-br from-primary/20 to-purple-500/20">
                {item.media_type === 'image' ? (
                  <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><Video className="h-12 w-12 text-white/30" /></div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="sm" onClick={() => { if(confirm('Hapus item ini?')) deleteItem(item.id); }}>
                    <Trash2 className="h-4 w-4 mr-1" />Hapus
                  </Button>
                </div>
              </div>
              <CardContent className="pt-3 pb-3">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{item.media_type}</Badge>
                  {item.gallery_albums?.name && <Badge variant="info" className="text-[10px]">{item.gallery_albums.name}</Badge>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <Card><CardContent className="pt-6 text-center py-16">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada item galeri</p>
        </CardContent></Card>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Upload ke Galeri</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Judul *</Label><Input value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} /></div>
                <div className="space-y-2"><Label>Deskripsi</Label><Input value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Album</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={uploadForm.album_id} onChange={e => setUploadForm({...uploadForm, album_id: e.target.value})}>
                      <option value="">Tanpa Album</option>
                      {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Media</Label>
                    <select className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" value={uploadForm.media_type} onChange={e => setUploadForm({...uploadForm, media_type: e.target.value as any})}>
                      <option value="image">Foto</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 cursor-pointer transition-colors">
                    <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    {selectedFiles.length > 0 ? (
                      <p className="text-sm text-primary">{selectedFiles.length} file dipilih</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Klik untuk pilih file</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleUpload} className="flex-1" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
                  <Button variant="outline" onClick={() => setShowUpload(false)}>Batal</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album Modal */}
      <AnimatePresence>
        {showAlbum && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAlbum(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-md glass rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Buat Album Baru</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAlbum(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nama Album *</Label><Input value={albumForm.name} onChange={e => setAlbumForm({...albumForm, name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Deskripsi</Label><Input value={albumForm.description} onChange={e => setAlbumForm({...albumForm, description: e.target.value})} /></div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddAlbum} className="flex-1">Buat Album</Button>
                  <Button variant="outline" onClick={() => setShowAlbum(false)}>Batal</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
