'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Upload, Download, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const assignments = [
  {
    id: 1,
    title: 'Essay Bahasa Indonesia',
    subject: 'Bahasa Indonesia',
    description: 'Buat essay tentang kebudayaan Indonesia minimal 500 kata',
    dueDate: '2024-10-20',
    status: 'pending',
    submitted: false,
  },
  {
    id: 2,
    title: 'Soal Matematika Bab 5',
    subject: 'Matematika',
    description: 'Kerjakan soal halaman 120-125 nomor 1-20',
    dueDate: '2024-10-22',
    status: 'pending',
    submitted: false,
  },
  {
    id: 3,
    title: 'Laporan Praktikum Fisika',
    subject: 'Fisika',
    description: 'Buat laporan praktikum tentang hukum Newton',
    dueDate: '2024-10-25',
    status: 'pending',
    submitted: false,
  },
  {
    id: 4,
    title: 'Presentasi Sejarah',
    subject: 'Sejarah',
    description: 'Presentasi tentang kemerdekaan Indonesia',
    dueDate: '2024-10-10',
    status: 'submitted',
    submitted: true,
    score: 85,
  },
];

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !a.submitted;
    if (filter === 'submitted') return a.submitted;
    return true;
  });

  const handleUpload = (assignmentId: number) => {
    toast.success('Jawaban berhasil diupload!');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Tugas</h1>
        <p className="text-muted-foreground">Kelola dan submit tugas-tugas Anda</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'pending', label: 'Belum Submit' },
            { value: 'submitted', label: 'Sudah Submit' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value as any)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Assignments Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredAssignments.map((assignment, i) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full hover:glow-primary transition-all duration-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {assignment.subject}
                    </Badge>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {assignment.description}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Deadline: {new Date(assignment.dueDate).toLocaleDateString('id-ID')}</span>
                </div>

                {assignment.submitted ? (
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Sudah Disubmit</span>
                    </div>
                    {assignment.score && (
                      <p className="text-sm text-muted-foreground">
                        Nilai: <span className="font-semibold text-white">{assignment.score}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpload(assignment.id)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Jawaban
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
