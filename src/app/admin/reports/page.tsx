'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Filter, Calendar, Users, Award, CheckCircle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const supabase = createClient();

type ReportType = 'attendance' | 'grades' | 'assignments' | 'students';

interface Filters {
  dateFrom: string;
  dateTo: string;
  studentId: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    studentId: '',
  });
  const [students, setStudents] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name');
    
    setStudents(data || []);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      switch (reportType) {
        case 'attendance':
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select(`
              *,
              student:profiles!student_id(full_name, nisn, email)
            `)
            .gte(filters.dateFrom ? 'date' : 'id', filters.dateFrom || '1970-01-01')
            .lte(filters.dateTo ? 'date' : 'id', filters.dateTo || '2099-12-31')
            .eq(filters.studentId ? 'student_id' : 'id', filters.studentId || '00000000-0000-0000-0000-000000000000')
            .order('date', { ascending: false });
          
          data = attendanceData || [];
          break;

        case 'grades':
          const { data: gradesData } = await supabase
            .from('grades')
            .select(`
              *,
              student:profiles!student_id(full_name, nisn, email)
            `)
            .eq(filters.studentId ? 'student_id' : 'id', filters.studentId || '00000000-0000-0000-0000-000000000000')
            .order('created_at', { ascending: false });
          
          data = gradesData || [];
          break;

        case 'assignments':
          const { data: assignmentsData } = await supabase
            .from('assignment_submissions')
            .select(`
              *,
              student:profiles!student_id(full_name, nisn, email),
              assignment:assignments(title, subject, due_date)
            `)
            .gte(filters.dateFrom ? 'submitted_at' : 'id', filters.dateFrom || '1970-01-01')
            .lte(filters.dateTo ? 'submitted_at' : 'id', filters.dateTo || '2099-12-31')
            .eq(filters.studentId ? 'student_id' : 'id', filters.studentId || '00000000-0000-0000-0000-000000000000')
            .order('submitted_at', { ascending: false });
          
          data = assignmentsData || [];
          break;

        case 'students':
          const { data: studentsData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('full_name');
          
          data = studentsData || [];
          break;
      }

      setReportData(data);
      toast.success(`${data.length} data ditemukan`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Gagal generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.text('LAPORAN X-5 SMAN 1 PURBALINGGA', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      const reportTitles: Record<ReportType, string> = {
        attendance: 'Laporan Kehadiran',
        grades: 'Laporan Nilai',
        assignments: 'Laporan Tugas',
        students: 'Laporan Data Siswa',
      };
      doc.text(reportTitles[reportType], pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, pageWidth / 2, 38, { align: 'center' });

      // Table data based on report type
      let headers: string[] = [];
      let rows: any[][] = [];

      switch (reportType) {
        case 'attendance':
          headers = ['No', 'Nama Siswa', 'NISN', 'Tanggal', 'Status', 'Keterangan'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.student?.full_name || '-',
            item.student?.nisn || '-',
            format(new Date(item.date), 'dd/MM/yyyy'),
            item.status,
            item.note || '-',
          ]);
          break;

        case 'grades':
          headers = ['No', 'Nama Siswa', 'NISN', 'Mata Pelajaran', 'Jenis', 'Nilai', 'Tanggal'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.student?.full_name || '-',
            item.student?.nisn || '-',
            item.subject,
            item.type,
            item.score,
            format(new Date(item.created_at), 'dd/MM/yyyy'),
          ]);
          break;

        case 'assignments':
          headers = ['No', 'Nama Siswa', 'NISN', 'Tugas', 'Mapel', 'Tanggal Submit', 'Nilai'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.student?.full_name || '-',
            item.student?.nisn || '-',
            item.assignment?.title || '-',
            item.assignment?.subject || '-',
            format(new Date(item.submitted_at), 'dd/MM/yyyy'),
            item.score || '-',
          ]);
          break;

        case 'students':
          headers = ['No', 'Nama', 'NISN', 'Email', 'Telepon', 'Alamat'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.full_name,
            item.nisn || '-',
            item.email,
            item.phone || '-',
            item.address || '-',
          ]);
          break;
      }

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`laporan-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF berhasil di-download');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Gagal export PDF');
    } finally {
      setGenerating(false);
    }
  };

  const exportToExcel = () => {
    setGenerating(true);
    try {
      let headers: string[] = [];
      let rows: any[][] = [];

      switch (reportType) {
        case 'attendance':
          headers = ['No', 'Nama Siswa', 'NISN', 'Email', 'Tanggal', 'Status', 'Keterangan'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.student?.full_name || '-',
            item.student?.nisn || '-',
            item.student?.email || '-',
            format(new Date(item.date), 'dd/MM/yyyy'),
            item.status,
            item.note || '-',
          ]);
          break;

        case 'grades':
          headers = ['No', 'Nama Siswa', 'NISN', 'Email', 'Mata Pelajaran', 'Jenis', 'Nilai', 'Tanggal'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.student?.full_name || '-',
            item.student?.nisn || '-',
            item.student?.email || '-',
            item.subject,
            item.type,
            item.score,
            format(new Date(item.created_at), 'dd/MM/yyyy'),
          ]);
          break;

        case 'assignments':
          headers = ['No', 'Nama Siswa', 'NISN', 'Email', 'Tugas', 'Mapel', 'Tanggal Submit', 'Nilai'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.student?.full_name || '-',
            item.student?.nisn || '-',
            item.student?.email || '-',
            item.assignment?.title || '-',
            item.assignment?.subject || '-',
            format(new Date(item.submitted_at), 'dd/MM/yyyy'),
            item.score || '-',
          ]);
          break;

        case 'students':
          headers = ['No', 'Nama', 'NISN', 'Email', 'Telepon', 'Alamat', 'Nama Orang Tua'];
          rows = reportData.map((item, idx) => [
            idx + 1,
            item.full_name,
            item.nisn || '-',
            item.email,
            item.phone || '-',
            item.address || '-',
            item.parent_name || '-',
          ]);
          break;
      }

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

      // Set column widths
      const colWidths = headers.map((h, idx) => ({ wch: Math.max(h.length, 15) }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `laporan-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel berhasil di-download');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Gagal export Excel');
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    { value: 'attendance', label: 'Kehadiran', icon: CheckCircle, color: 'text-success' },
    { value: 'grades', label: 'Nilai', icon: Award, color: 'text-primary' },
    { value: 'assignments', label: 'Tugas', icon: BookOpen, color: 'text-info' },
    { value: 'students', label: 'Data Siswa', icon: Users, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Report Generator</h1>
        <p className="text-muted-foreground">Generate dan export laporan dalam format PDF atau Excel</p>
      </motion.div>

      {/* Report Type Selection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pilih Jenis Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = reportType === type.value;
                return (
                  <Button
                    key={type.value}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => setReportType(type.value as ReportType)}
                    className="h-24 flex flex-col gap-2"
                  >
                    <Icon className={`h-6 w-6 ${isSelected ? '' : type.color}`} />
                    <span className="text-sm">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportType !== 'students' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tanggal Dari</label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tanggal Sampai</label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Siswa</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-background border border-input"
                  value={filters.studentId}
                  onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                >
                  <option value="">Semua Siswa</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={generateReport} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Results */}
      {reportData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hasil Laporan ({reportData.length} data)</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={exportToPDF} disabled={generating} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={exportToExcel} disabled={generating} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Klik tombol PDF atau Excel untuk download laporan
              </div>
              <div className="rounded-lg border">
                <div className="p-4 bg-muted/50 font-medium text-sm">
                  Preview: {reportData.length} data ditemukan
                </div>
                <div className="p-4 text-sm text-muted-foreground">
                  Gunakan tombol export di atas untuk download laporan lengkap
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
