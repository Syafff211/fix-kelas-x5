'use client';

import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Bell,
  Calendar,
  Image,
  FileText,
  Activity,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stats = [
  { icon: Users, label: 'Total Siswa', value: '32', change: '+2', color: 'text-primary', bg: 'bg-primary/20' },
  { icon: CheckCircle, label: 'Kehadiran Hari Ini', value: '95%', change: '+3%', color: 'text-success', bg: 'bg-success/20' },
  { icon: BookOpen, label: 'Tugas Aktif', value: '8', change: '+1', color: 'text-info', bg: 'bg-info/20' },
  { icon: TrendingUp, label: 'Rata-rata Nilai', value: '87.5', change: '+2.5', color: 'text-warning', bg: 'bg-warning/20' },
];

const recentActivities = [
  { action: 'Absensi diperbarui', user: 'Ahmad Rizky', time: '5 menit lalu', type: 'attendance' },
  { action: 'Tugas baru dibuat', user: 'Admin', time: '1 jam lalu', type: 'assignment' },
  { action: 'Nilai diupdate', user: 'Admin', time: '2 jam lalu', type: 'grade' },
  { action: 'Pengumuman baru', user: 'Admin', time: '3 jam lalu', type: 'announcement' },
  { action: 'Foto galeri diupload', user: 'Admin', time: '5 jam lalu', type: 'gallery' },
];

const quickActions = [
  { icon: Users, label: 'Kelola Siswa', href: '/admin/students', color: 'text-primary', bg: 'bg-primary/20' },
  { icon: Calendar, label: 'Kelola Absensi', href: '/admin/attendance', color: 'text-success', bg: 'bg-success/20' },
  { icon: FileText, label: 'Kelola Tugas', href: '/admin/assignments', color: 'text-info', bg: 'bg-info/20' },
  { icon: TrendingUp, label: 'Kelola Nilai', href: '/admin/grades', color: 'text-warning', bg: 'bg-warning/20' },
  { icon: Image, label: 'Kelola Galeri', href: '/admin/gallery', color: 'text-purple-500', bg: 'bg-purple-500/20' },
  { icon: Bell, label: 'Pengumuman', href: '/admin/announcements', color: 'text-pink-500', bg: 'bg-pink-500/20' },
  { icon: Activity, label: 'Kalender', href: '/admin/calendar', color: 'text-cyan-500', bg: 'bg-cyan-500/20' },
  { icon: Shield, label: 'Landing Page', href: '/admin/landing', color: 'text-orange-500', bg: 'bg-orange-500/20' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <Badge variant="default">Super Admin</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Kelola seluruh aspek platform X-5 SMAN 1 Purbalingga
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:glow-primary transition-all duration-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge variant="success">{stat.change}</Badge>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
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
                <a
                  key={i}
                  href={action.href}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-center group"
                >
                  <div className={`h-12 w-12 rounded-xl ${action.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <p className="text-sm font-medium">{action.label}</p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">oleh {activity.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
