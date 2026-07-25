'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, AlertCircle, Save, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudents, useAttendance, useFileUpload } from '@/hooks/useSupabase';
import { toast } from 'sonner';

export default function AdminAttendancePage() {
  const { students, loading: loadingStudents } = useStudents();
  const { attendance, loading: loadingAttendance, bulkSubmitAttendance, refetch } = useAttendance();
  const { uploadFile, uploading } = useFileUpload('medical-certificates');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; note: string; file?: File }>>({});
  const [saving, setSaving] = useState(false);

  const getStatus = (studentId: string) => {
    const existing = attendance.find(a => a.student_id === studentId && a.date === selectedDate);
    if (existing) return existing.status;
    return attendanceData[studentId]?.status || '';
  };

  const setStatus = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, note: prev[studentId]?.note || '' }
    }));
  };

  const setNote = (studentId: string, note: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note, status: prev[studentId]?.status || '' }
    }));
  };

  const setFile = (studentId: string, file: File) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], file }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records: any[] = [];
      
      for (const [studentId, data] of Object.entries(attendanceData)) {
        if (!data.status) continue;
        
        let fileUrl = null;
        if (data.status === 'sick' && data.file) {
          fileUrl = await uploadFile(data.file, `${studentId}/${selectedDate}-${data.file.name}`);
        }

        records.push({
          student_id: studentId,
          date: selectedDate,
          status: data.status,
          note: data.note || null,
        });
      }

      if (records.length === 0) {
        toast.error('Pilih status kehadiran minimal 1 siswa!');
        setSaving(false);
        return;
      }

      await bulkSubmitAttendance(records);
    } catch (error) {
      toast.error('Gagal menyimpan absensi');
    }
    setSaving(false);
  };

  const statusOptions = [
    { value: 'present', label: 'Hadir', icon: CheckCircle, color: 'success' },
    { value: 'permission', label: 'Izin', icon: AlertCircle, color: 'warning' },
    { value: 'sick', label: 'Sakit', icon: XCircle, color: 'destructive' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Kehadiran</h1>
          <p className="text-muted-foreground">Tandai kehadiran siswa</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="flex h-11 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </Button>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Absensi Tanggal: {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {students.map((student, i) => {
                const currentStatus = getStatus(student.id);
                return (
                  <motion.div key={student.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0">
                          {student.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">NISN: {student.nisn || '-'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {statusOptions.map(opt => {
                          const Icon = opt.icon;
                          const isActive = currentStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(student.id, opt.value)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                isActive
                                  ? `bg-${opt.color}/20 text-${opt.color} border border-${opt.color}/30`
                                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {currentStatus && (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Catatan (opsional)"
                            className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                            value={attendanceData[student.id]?.note || ''}
                            onChange={e => setNote(student.id, e.target.value)}
                          />
                          {currentStatus === 'sick' && (
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer text-sm text-destructive">
                              <FileText className="h-4 w-4" />
                              <span>Surat Dokter</span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error('File maksimal 5MB');
                                      return;
                                    }
                                    setFile(student.id, file);
                                    toast.success(`File ${file.name} dipilih`);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Siswa</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 20).map((record, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-sm">{new Date(record.date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4 text-sm font-medium">{record.profiles?.full_name || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={record.status === 'present' ? 'success' : record.status === 'sick' ? 'error' : 'warning'}>
                        {record.status === 'present' ? 'Hadir' : record.status === 'sick' ? 'Sakit' : record.status === 'permission' ? 'Izin' : 'Absen'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{record.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
