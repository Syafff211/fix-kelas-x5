'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, AlertCircle, Clock, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const supabase = createClient();

interface Attendance {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'permission' | 'sick';
  note?: string;
  created_at: string;
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (user) {
      fetchAttendance();
      checkTodayAttendance();
    }
  }, [user]);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendances(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user?.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setTodayAttendance(data);
        setSelectedStatus(data.status);
        setNote(data.note || '');
      }
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const submitAttendance = async () => {
    if (!selectedStatus) {
      toast.error('Pilih status kehadiran!');
      return;
    }

    if ((selectedStatus === 'permission' || selectedStatus === 'sick') && !note.trim()) {
      toast.error('Mohon isi alasan untuk izin atau sakit!');
      return;
    }

    setSubmitting(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          student_id: user?.id,
          date: today,
          status: selectedStatus,
          note: note.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setTodayAttendance(data);
      setAttendances(prev => [data, ...prev.filter(a => a.date !== today)]);
      toast.success('Absensi berhasil disimpan!');
    } catch (error: any) {
      console.error('Error submitting attendance:', error);
      toast.error('Gagal menyimpan absensi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: attendances.length,
    present: attendances.filter(a => a.status === 'present').length,
    absent: attendances.filter(a => a.status === 'absent').length,
    late: attendances.filter(a => a.status === 'late').length,
    permission: attendances.filter(a => a.status === 'permission').length,
    sick: attendances.filter(a => a.status === 'sick').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'late':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'permission':
      case 'sick':
        return <AlertCircle className="h-5 w-5 text-info" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      present: 'success',
      absent: 'destructive',
      late: 'warning',
      permission: 'info',
      sick: 'info',
    };
    const labels: Record<string, string> = {
      present: 'Hadir',
      absent: 'Absen',
      late: 'Terlambat',
      permission: 'Izin',
      sick: 'Sakit',
    };
    return { variant: variants[status] || 'outline', label: labels[status] || status };
  };

  const statusOptions = [
    { value: 'present', label: 'Hadir', icon: CheckCircle, color: 'success' },
    { value: 'late', label: 'Terlambat', icon: Clock, color: 'warning' },
    { value: 'permission', label: 'Izin', icon: AlertCircle, color: 'info' },
    { value: 'sick', label: 'Sakit', icon: AlertCircle, color: 'info' },
    { value: 'absent', label: 'Absen', icon: XCircle, color: 'destructive' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat data kehadiran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Kehadiran</h1>
        <p className="text-muted-foreground">Absensi dan riwayat kehadiran Anda</p>
      </motion.div>

      {/* Absen Hari Ini */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-background/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Absen Hari Ini
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAttendance ? (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <div>
                    <p className="font-semibold">Anda sudah absen hari ini</p>
                    <p className="text-sm text-muted-foreground">
                      Status: <Badge variant={getStatusBadge(todayAttendance.status).variant}>
                        {getStatusBadge(todayAttendance.status).label}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedStatus === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setSelectedStatus(option.value)}
                        className={`h-20 flex flex-col gap-2 ${
                          isSelected ? `bg-${option.color} hover:bg-${option.color}/90` : ''
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    );
                  })}
                </div>

                {(selectedStatus === 'permission' || selectedStatus === 'sick') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Alasan {selectedStatus === 'permission' ? 'Izin' : 'Sakit'}
                    </label>
                    <Input
                      placeholder="Contoh: Demam, Acara keluarga, dll"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={submitAttendance}
                  disabled={!selectedStatus || submitting}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Menyimpan...' : 'Simpan Absensi'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-background/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-background/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <Badge variant="success">{stats.present}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.present}</p>
              <p className="text-xs text-muted-foreground">Hadir</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-background/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <Badge variant="destructive">{stats.absent}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absen</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="bg-background/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <Badge variant="warning">{stats.late}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Terlambat</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-background/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-info" />
                <Badge variant="info">{stats.permission}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.permission}</p>
              <p className="text-xs text-muted-foreground">Izin</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="bg-background/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-info" />
                <Badge variant="info">{stats.sick}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.sick}</p>
              <p className="text-xs text-muted-foreground">Sakit</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-background/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Riwayat Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            {attendances.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Belum ada data kehadiran</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendances.map((attendance, i) => {
                  const badge = getStatusBadge(attendance.status);
                  return (
                    <motion.div
                      key={attendance.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {getStatusIcon(attendance.status)}
                      <div className="flex-1">
                        <p className="font-medium">
                          {format(new Date(attendance.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                        </p>
                        {attendance.note && (
                          <p className="text-sm text-muted-foreground mt-1">{attendance.note}</p>
                        )}
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
