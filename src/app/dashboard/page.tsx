'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Bell,
  Clock,
  MessageSquare,
  Users,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import Link from 'next/link';

const stats = [
  { icon: CheckCircle, label: 'Kehadiran', value: '95%', color: 'text-success', bg: 'bg-success/20', href: '/dashboard/attendance' },
  { icon: BookOpen, label: 'Tugas Aktif', value: '3', color: 'text-primary', bg: 'bg-primary/20', href: '/dashboard/assignments' },
  { icon: TrendingUp, label: 'Rata-rata Nilai', value: '87.5', color: 'text-info', bg: 'bg-info/20', href: '/dashboard/grades' },
  { icon: Award, label: 'Achievements', value: '5', color: 'text-warning', bg: 'bg-warning/20', href: '/dashboard/achievements' },
];

const todaySchedule = [
  { time: '07:30', subject: 'Matematika', room: 'R.101', status: 'ongoing' },
  { time: '09:00', subject: 'Bahasa Indonesia', room: 'R.101', status: 'upcoming' },
  { time: '10:30', subject: 'Fisika', room: 'Lab Fisika', status: 'upcoming' },
  { time: '13:00', subject: 'Bahasa Inggris', room: 'R.101', status: 'upcoming' },
];

const recentAnnouncements = [
  { title: 'Ujian Tengah Semester', date: '15-20 Oktober 2024', pinned: true, href: '/dashboard/announcements' },
  { title: 'Class Meeting', date: '25 Oktober 2024', pinned: false, href: '/dashboard/announcements' },
  { title: 'Study Tour', date: 'November 2024', pinned: false, href: '/dashboard/announcements' },
];

const upcomingAssignments = [
  { title: 'Essay Bahasa Indonesia', due: '3 hari lagi', subject: 'B. Indonesia', href: '/dashboard/assignments' },
  { title: 'Soal Matematika Bab 5', due: '5 hari lagi', subject: 'Matematika', href: '/dashboard/assignments' },
  { title: 'Laporan Praktikum Fisika', due: '1 minggu lagi', subject: 'Fisika', href: '/dashboard/assignments' },
];

const quickActions = [
  { icon: MessageSquare, label: 'Chat Teman', href: '/dashboard/chats', color: 'text-primary', bg: 'bg-primary/20' },
  { icon: Users, label: 'Lihat Teman', href: '/dashboard/friends', color: 'text-info', bg: 'bg-info/20' },
  { icon: Calendar, label: 'Jadwal', href: '/dashboard/schedule', color: 'text-success', bg: 'bg-success/20' },
  { icon: Bell, label: 'Notifikasi', href: '/dashboard/notifications', color: 'text-warning', bg: 'bg-warning/20' },
];

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Selamat Datang, {user?.full_name || 'Siswa'}! 👋
          </h1>
          <p className="text-white/90 text-lg">
            Berikut ringkasan kegiatan kelas X-5 hari ini.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <BookOpen className="h-64 w-64" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:glow-primary transition-all duration-300 cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2 hover:bg-white/5 hover:border-primary/50 transition-all"
                  >
                    <div className={`h-10 w-10 rounded-lg ${action.bg} flex items-center justify-center`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-sm">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Jadwal Hari Ini
                </CardTitle>
                <Link href="/dashboard/schedule">
                  <Button variant="ghost" size="sm">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaySchedule.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-semibold">{item.time}</p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex-1">
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.room}</p>
                    </div>
                    <Badge
                      variant={item.status === 'ongoing' ? 'success' : 'outline'}
                    >
                      {item.status === 'ongoing' ? 'Berlangsung' : 'Akan Datang'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Pengumuman
                </CardTitle>
                <Link href="/dashboard/announcements">
                  <Button variant="ghost" size="sm">
                    Semua
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnnouncements.map((item, i) => (
                  <Link key={i} href={item.href}>
                    <div className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                        </div>
                        {item.pinned && (
                          <Badge variant="warning" className="text-[10px]">Pinned</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Tugas Mendatang
              </CardTitle>
              <Link href="/dashboard/assignments">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {upcomingAssignments.map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer border border-white/5 hover:border-primary/30">
                    <Badge variant="outline" className="mb-2">{item.subject}</Badge>
                    <h3 className="font-medium mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Deadline: <span className="text-warning">{item.due}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
