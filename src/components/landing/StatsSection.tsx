'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Users, Award, BookOpen, TrendingUp } from 'lucide-react';
import { useLandingContent } from '@/hooks/useLandingContent';

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [count, setCount] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    // If target is not a number, just display it
    const numericValue = parseInt(target.replace(/\D/g, ''));
    if (isNaN(numericValue)) {
      setCount(target);
      return;
    }

    let start = 0;
    const duration = 2000;
    const increment = numericValue / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start) + suffix);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, suffix]);

  return <span ref={ref}>{count}</span>;
}

export function StatsSection() {
  const { getContent } = useLandingContent();

  const stats = [
    { 
      icon: Users, 
      label: 'Total Siswa', 
      value: getContent('stats', 'total_students', '32'),
      color: 'text-primary',
      bg: 'bg-primary/20'
    },
    { 
      icon: TrendingUp, 
      label: 'Kehadiran', 
      value: getContent('stats', 'attendance_rate', '95%'),
      color: 'text-success',
      bg: 'bg-success/20'
    },
    { 
      icon: Award, 
      label: 'Prestasi', 
      value: getContent('stats', 'achievements', '12'),
      color: 'text-warning',
      bg: 'bg-warning/20'
    },
    { 
      icon: BookOpen, 
      label: 'Mata Pelajaran', 
      value: getContent('stats', 'subjects', '14'),
      color: 'text-info',
      bg: 'bg-info/20'
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center hover:glow-primary transition-all duration-500 group stat-card"
            >
              <div className={`h-14 w-14 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2 stat-value">
                <AnimatedCounter target={stat.value} />
              </div>
              <div className="text-sm text-muted-foreground stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
