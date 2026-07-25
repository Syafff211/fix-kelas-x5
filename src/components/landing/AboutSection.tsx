'use client';

import { motion } from 'framer-motion';
import { Heart, Target, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLandingContent } from '@/hooks/useLandingContent';

export function AboutSection() {
  const { getContent } = useLandingContent();

  const vision = getContent('about', 'vision', 'Menjadi kelas yang unggul dalam prestasi akademik dan non-akademik, berkarakter mulia, serta mampu bersaing di era global dengan memanfaatkan teknologi digital secara bijak dan bertanggung jawab.');
  const missionText = getContent('about', 'mission', 'Menciptakan lingkungan belajar yang kondusif dan menyenangkan|Mendorong semangat kompetisi positif antar siswa|Mengembangkan kreativitas dan bakat di berbagai bidang|Membangun solidaritas dan kebersamaan antar anggota kelas');
  const motto = getContent('about', 'motto', 'Bersama Kita Bisa, Bersama Kita Juara!');
  
  const missionList = missionText.split('|').filter(m => m.trim());

  return (
    <section id="about" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tentang <span className="text-gradient">Kelas Kami</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Kenali lebih dekat kelas X-5 SMAN 1 Purbalingga
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full hover:glow-primary transition-all duration-500">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Visi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed vision-text">
                  {vision}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full hover:glow-primary transition-all duration-500">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-2xl">Misi</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground mission-text">
                  {missionList.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Class Motto */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card className="text-center hover:glow-primary transition-all duration-500">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-3 mx-auto">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <CardTitle className="text-2xl">Motto Kelas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold text-gradient italic motto-text">
                  "{motto}"
                </p>
                <p className="text-muted-foreground mt-4">
                  Satu kelas, satu keluarga, satu tujuan - menjadi yang terbaik.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
