'use client';

import { useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const supabase = createClient();

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendance: 0,
    assignments: 0,
    averageGrade: 0,
    achievements: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', user?.id);

      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          submissions:assignment_submissions(id, submitted_at)
        `)
        .order('due_date', { ascending: true });

      const pendingAssignments = assignmentsData?.filter(a => !a.submissions || a.submissions.length === 0) || [];

      // Fetch grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select('score, max_score')
        .eq('student_id', user?.id);

      const averageGrade = gradesData && gradesData.length > 0
        ? Math.round(gradesData.reduce((sum, g) => sum + (g.score / g.max_score * 100), 0) / gradesData.length)
        : 0;

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch today's schedule
      const today = new Date();
      const dayOfWeek = today.getDay();
      const { data: scheduleData } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .order('start_time', { ascending: true });

      setStats({
        attendance: attendancePercentage,
        assignments: pendingAssignments.length,
        averageGrade,
        achievements: 0, // Can be calculated from grades or separate table
      });

      setTodaySchedule(scheduleData || []);
      setRecentAnnouncements(announcementsData || []);
      setUpcomingAssignments(pendingAssignments.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { 
      icon: CheckCircle, 
      label: 'Kehadiran', 
      value: `${stats.attendance}%`, 
      color: 'text-success', 
      bg: 'bg-success/20', 
      href: '/dashboard/attendance' 
    },
    { 
      icon: BookOpen, 
      label: 'Tugas Aktif', 
      value: stats.assignments.toString(), 
      color: 'text-primary', 
      bg: 'bg-primary/20', 
      href: '/dashboard/assignments' 
    },
    { 
      icon: TrendingUp, 
      label: 'Rata-rata Nilai', 
      value: stats.averageGrade.toString(), 
      color: 'text-info', 
      bg: 'bg-info/20', 
      href: '/dashboard/grades' 
    },
    { 
      icon: Award, 
      label: 'Achievements', 
      value: stats.achievements.toString(), 
      color: 'text-warning', 
      bg: 'bg-warning/20', 
      href: '/dashboard/achievements' 
    },
  ];

  const quickActions = [
    { icon: MessageSquare, label: 'Chat Teman', href: '/dashboard/messages', color: 'text-primary', bg: 'bg-primary/20' },
    { icon: Users, label: 'Lihat Teman', href: '/dashboard/friends', color: 'text-info', bg: 'bg-info/20' },
    { icon: Calendar, label: 'Jadwal', href: '/dashboard/schedule', color: 'text-success', bg: 'bg-success/20' },
    { icon: Bell, label: 'Notifikasi', href: '/dashboard/notifications', color: 'text-warning', bg: 'bg-warning/20' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

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
        {statsCards.map((stat, i) => (
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
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Belum ada jadwal hari ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                    >
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold">{item.start_time}</p>
                      </div>
                      <div className="h-10 w-px bg-white/10" />
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {recentAnnouncements.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Belum ada pengumuman</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAnnouncements.map((item, i) => (
                    <Link key={i} href="/dashboard/announcements">
                      <div className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(item.created_at), 'dd MMM yyyy', { locale: id })}
                            </p>
                          </div>
                          {item.is_pinned && (
                            <Badge variant="warning" className="text-[10px]">Pinned</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Belum ada tugas mendatang</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {upcomingAssignments.map((item, i) => (
                  <Link key={i} href="/dashboard/assignments">
                    <div className="p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer border border-white/5 hover:border-primary/30">
                      {item.subject && (
                        <Badge variant="outline" className="mb-2">{item.subject}</Badge>
                      )}
                      <h3 className="font-medium mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Deadline: <span className="text-warning">
                          {format(new Date(item.due_date), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
