'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FloatingCrystal } from '@/components/ui/FloatingCrystal';
import { useLandingContent } from '@/hooks/useLandingContent';

export function HeroSection() {
  const { getContent, loading } = useLandingContent();

  const title = getContent('hero', 'title', 'Kelas X-5 SMAN 1 Purbalingga');
  const subtitle = getContent('hero', 'subtitle', 'Platform Digital Kelas Premium');
  const description = getContent('hero', 'description', 'Platform digital kelas premium untuk mengelola kehadiran, tugas, nilai, dan kegiatan kelas dengan teknologi modern dan desain elegan.');
  const buttonText = getContent('hero', 'button_text', 'Mulai Sekarang');
  const buttonLink = getContent('hero', 'button_link', '/auth/login');
  const backgroundImage = getContent('hero', 'background_image', '');

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img src={backgroundImage} alt="Hero Background" className="w-full h-full object-cover opacity-20" />
        </div>
      )}
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {subtitle}
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient">{title}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
          >
            {description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href={buttonLink}>
              <Button variant="gradient" size="xl">
                {buttonText}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button variant="glass" size="xl">
              <Play className="h-5 w-5 mr-2" />
              Lihat Video
            </Button>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative w-full h-64 mt-20"
          >
            <FloatingCrystal />
          </motion.div>

          {/* Stats Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
          >
            {[
              { value: getContent('stats', 'total_students', '32'), label: 'Siswa' },
              { value: getContent('stats', 'attendance_rate', '95%'), label: 'Kehadiran' },
              { value: getContent('stats', 'achievements', '12'), label: 'Prestasi' },
              { value: getContent('stats', 'subjects', '14'), label: 'Mapel' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
