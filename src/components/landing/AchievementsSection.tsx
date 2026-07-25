'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const achievements = [
  { title: 'Juara 1 Olimpiade Matematika', level: 'Kabupaten', year: '2024' },
  { title: 'Juara 2 Lomba Pidato Bahasa Inggris', level: 'Provinsi', year: '2024' },
  { title: 'Juara 1 Futsal Antar Kelas', level: 'Sekolah', year: '2024' },
  { title: 'Juara 3 Karya Tulis Ilmiah', level: 'Kabupaten', year: '2023' },
];

export function AchievementsSection() {
  return (
    <section id="achievements" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Prestasi</span> Kami
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Pencapaian membanggakan dari siswa-siswi kelas X-5
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {achievements.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="hover:glow-primary transition-all duration-500">
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="info">{item.level}</Badge>
                      <Badge variant="outline">{item.year}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
