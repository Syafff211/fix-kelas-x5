'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

const galleryItems = [
  { title: 'Upacara Bendera', category: 'Kegiatan' },
  { title: 'Study Group', category: 'Akademik' },
  { title: 'Class Meeting', category: 'Olahraga' },
  { title: 'Ulang Tahun Kelas', category: 'Perayaan' },
  { title: 'Presentasi Proyek', category: 'Akademik' },
  { title: 'Liburan Bersama', category: 'Rekreasi' },
];

export function GallerySection() {
  return (
    <section id="gallery" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Galeri</span> Kegiatan
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Momen-momen berharga kelas X-5
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-square rounded-2xl overflow-hidden glass cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <ImageIcon className="h-12 w-12 text-white/40 mb-3" />
                <h3 className="text-white font-semibold text-center">{item.title}</h3>
                <span className="text-xs text-muted-foreground mt-1">{item.category}</span>
              </div>
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
