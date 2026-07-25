'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';

const galleryItems = [
  { title: 'Upacara Bendera', category: 'Kegiatan', date: '2024-10-01' },
  { title: 'Study Group', category: 'Akademik', date: '2024-09-28' },
  { title: 'Class Meeting', category: 'Olahraga', date: '2024-09-25' },
  { title: 'Ulang Tahun Kelas', category: 'Perayaan', date: '2024-09-20' },
  { title: 'Presentasi Proyek', category: 'Akademik', date: '2024-09-15' },
  { title: 'Liburan Bersama', category: 'Rekreasi', date: '2024-09-10' },
  { title: 'Lomba 17 Agustus', category: 'Kegiatan', date: '2024-08-17' },
  { title: 'Praktikum Kimia', category: 'Akademik', date: '2024-08-10' },
  { title: 'Futsal Antar Kelas', category: 'Olahraga', date: '2024-08-05' },
];

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Galeri</h1>
        <p className="text-muted-foreground">Koleksi foto dan video kegiatan kelas</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {galleryItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group cursor-pointer overflow-hidden hover:glow-primary transition-all duration-500">
              <div className="aspect-square relative bg-gradient-to-br from-primary/20 to-purple-500/20">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-white/30 mb-2" />
                  <p className="text-sm font-medium text-center px-4">{item.title}</p>
                </div>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="pt-4">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.category} • {item.date}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
