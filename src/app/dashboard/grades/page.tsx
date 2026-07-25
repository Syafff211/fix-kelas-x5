'use client';

import { motion } from 'framer-motion';
import { Award, TrendingUp, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const grades = [
  { subject: 'Matematika', daily: 85, assignment: 90, mid: 88, final: 92, average: 88.75 },
  { subject: 'Bahasa Indonesia', daily: 88, assignment: 85, mid: 90, final: 87, average: 87.5 },
  { subject: 'Bahasa Inggris', daily: 92, assignment: 88, mid: 85, final: 90, average: 88.75 },
  { subject: 'Fisika', daily: 80, assignment: 85, mid: 82, final: 88, average: 83.75 },
  { subject: 'Kimia', daily: 85, assignment: 82, mid: 88, final: 85, average: 85 },
  { subject: 'Biologi', daily: 90, assignment: 88, mid: 92, final: 90, average: 90 },
];

export default function GradesPage() {
  const overallAverage = (grades.reduce((sum, g) => sum + g.average, 0) / grades.length).toFixed(2);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Nilai</h1>
        <p className="text-muted-foreground">Pantau performa akademik Anda</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glow-primary">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <p className="text-4xl font-bold text-gradient">{overallAverage}</p>
              <p className="text-sm text-muted-foreground mt-1">Rata-rata Keseluruhan</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <p className="text-4xl font-bold">A</p>
              <p className="text-sm text-muted-foreground mt-1">Predikat</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-info/20 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-8 w-8 text-info" />
              </div>
              <p className="text-4xl font-bold">{grades.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Mata Pelajaran</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grades Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mata Pelajaran</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Harian</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Tugas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">UTS</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">UAS</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rata-rata</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">{grade.subject}</td>
                      <td className="text-center py-4 px-4">{grade.daily}</td>
                      <td className="text-center py-4 px-4">{grade.assignment}</td>
                      <td className="text-center py-4 px-4">{grade.mid}</td>
                      <td className="text-center py-4 px-4">{grade.final}</td>
                      <td className="text-center py-4 px-4 font-semibold text-primary">
                        {grade.average.toFixed(2)}
                      </td>
                      <td className="text-center py-4 px-4">
                        <Badge variant={grade.average >= 85 ? 'success' : 'warning'}>
                          {grade.average >= 85 ? 'A' : 'B'}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
