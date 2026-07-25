'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, CheckCircle, XCircle, AlertCircle, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const attendanceSchema = z.object({
  status: z.enum(['present', 'permission', 'sick']),
  note: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

const attendanceHistory = [
  { date: '2024-10-14', status: 'present', note: '' },
  { date: '2024-10-13', status: 'present', note: '' },
  { date: '2024-10-12', status: 'sick', note: 'Demam' },
  { date: '2024-10-11', status: 'present', note: '' },
  { date: '2024-10-10', status: 'permission', note: 'Acara keluarga' },
  { date: '2024-10-09', status: 'present', note: '' },
  { date: '2024-10-08', status: 'present', note: '' },
];

const statusConfig = {
  present: { label: 'Hadir', icon: CheckCircle, color: 'text-success', bg: 'bg-success/20', badge: 'success' as const },
  permission: { label: 'Izin', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/20', badge: 'warning' as const },
  sick: { label: 'Sakit', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/20', badge: 'error' as const },
  absent: { label: 'Absen', icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/20', badge: 'outline' as const },
};

export default function AttendancePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
  });

  const status = watch('status');

  const onSubmit = async (data: AttendanceFormData) => {
    if (data.status === 'sick' && !selectedFile) {
      toast.error('Surat dokter wajib diupload untuk status Sakit');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Absensi berhasil disimpan!');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Gagal menyimpan absensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Format file harus JPG, PNG, atau PDF');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const stats = {
    present: attendanceHistory.filter((a) => a.status === 'present').length,
    permission: attendanceHistory.filter((a) => a.status === 'permission').length,
    sick: attendanceHistory.filter((a) => a.status === 'sick').length,
    percentage: Math.round(
      (attendanceHistory.filter((a) => a.status === 'present').length / attendanceHistory.length) * 100
    ),
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Kehadiran</h1>
        <p className="text-muted-foreground">Kelola dan pantau kehadiran Anda</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <p className="text-3xl font-bold">{stats.present}</p>
              <p className="text-sm text-muted-foreground">Hadir</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <p className="text-3xl font-bold">{stats.permission}</p>
              <p className="text-sm text-muted-foreground">Izin</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-3xl font-bold">{stats.sick}</p>
              <p className="text-sm text-muted-foreground">Sakit</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.percentage}%</p>
              <p className="text-sm text-muted-foreground">Kehadiran</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submit Attendance */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Absensi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Status Kehadiran</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'present', label: 'Hadir', icon: CheckCircle, color: 'success' },
                      { value: 'permission', label: 'Izin', icon: AlertCircle, color: 'warning' },
                      { value: 'sick', label: 'Sakit', icon: XCircle, color: 'destructive' },
                    ].map((option) => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          value={option.value}
                          {...register('status')}
                          className="peer sr-only"
                        />
                        <div className="p-4 rounded-xl border border-white/10 text-center hover:bg-white/5 transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                          <option.icon className={`h-6 w-6 mx-auto mb-2 text-${option.color}`} />
                          <p className="text-sm font-medium">{option.label}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Catatan (Opsional)</Label>
                  <textarea
                    id="note"
                    rows={3}
                    className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white resize-none"
                    placeholder="Tambahkan catatan..."
                    {...register('note')}
                  />
                </div>

                {status === 'sick' && (
                  <div className="space-y-2 p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <Label className="text-warning">
                      Upload Surat Dokter *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Format: JPG, PNG, PDF. Maksimal 5MB
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                        id="medical-cert"
                      />
                      <label
                        htmlFor="medical-cert"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        {selectedFile ? (
                          <>
                            <FileText className="h-8 w-8 text-primary mb-2" />
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Klik untuk upload surat dokter
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance History */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Kehadiran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {attendanceHistory.map((item, i) => {
                  const config = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                          {item.note && (
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
