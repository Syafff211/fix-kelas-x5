'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const timelineItems = [
  { date: 'Juli 2024', title: 'Awal Tahun Ajaran', description: 'Pembentukan kelas dan pemilihan pengurus' },
  { date: 'Agustus 2024', title: 'Class Meeting', description: 'Lomba antar kelas dalam rangka HUT RI' },
  { date: 'September 2024', title: 'Study Tour', description: 'Kunjungan edukatif ke museum dan tempat bersejarah' },
  { date: 'Oktober 2024', title: 'UTS', description: 'Ujian Tengah Semester Ganjil' },
  { date: 'November 2024', title: 'Class Anniversary', description: 'Perayaan ulang tahun kelas' },
  { date: 'Desember 2024', title: 'UAS', description: 'Ujian Akhir Semester Ganjil' },
];

export function TimelineSection() {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Timeline</span> Kegiatan
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Jadwal kegiatan kelas sepanjang tahun ajaran
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          {/* Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-purple-500/50 to-transparent" />

          {timelineItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex items-center gap-6 mb-8 ${
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'} hidden md:block`}>
                <div className="glass rounded-xl p-4 inline-block">
                  <p className="text-sm text-primary font-medium">{item.date}</p>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>

              {/* Dot */}
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background z-10" />

              <div className="flex-1 md:hidden pl-14">
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-primary font-medium">{item.date}</p>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>

              <div className={`flex-1 ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'} hidden md:block`}>
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
