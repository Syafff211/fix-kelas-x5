'use client';

import { motion } from 'framer-motion';
import { BookOpen, Download, ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const materials = [
  { id: 1, title: 'Buku Matematika Kelas X', category: 'Matematika', type: 'pdf', size: '5.2 MB' },
  { id: 2, title: 'Presentasi Fisika - Hukum Newton', category: 'Fisika', type: 'pptx', size: '3.8 MB' },
  { id: 3, title: 'Modul Bahasa Indonesia', category: 'Bahasa Indonesia', type: 'pdf', size: '2.1 MB' },
  { id: 4, title: 'Video Pembelajaran Kimia', category: 'Kimia', type: 'video', size: '45 MB' },
  { id: 5, title: 'Lembar Kerja Biologi', category: 'Biologi', type: 'docx', size: '1.5 MB' },
  { id: 6, title: 'Soal Latihan Sejarah', category: 'Sejarah', type: 'pdf', size: '800 KB' },
];

const categories = ['Semua', 'Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 'Sejarah'];

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Materi Pembelajaran</h1>
        <p className="text-muted-foreground">Akses materi dan sumber belajar</p>
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat, i) => (
            <Button key={i} variant={i === 0 ? 'default' : 'outline'} size="sm">
              {cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Materials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material, i) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full hover:glow-primary transition-all duration-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline">{material.type.toUpperCase()}</Badge>
                </div>
                <CardTitle className="text-base mt-3">{material.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="text-xs">{material.category}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">{material.size}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
