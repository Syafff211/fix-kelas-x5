'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Grade {
  id: string;
  subject: string;
  type: 'daily' | 'assignment' | 'midterm' | 'final';
  score: number;
  max_score: number;
  weight?: number;
  note?: string;
  created_at: string;
}

export default function GradesPage() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGrades();
    }
  }, [user]);

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 85) return 'text-success';
    if (percentage >= 70) return 'text-primary';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 85) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
  };

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  // Calculate average per subject
  const subjectAverages = Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
    const totalWeighted = subjectGrades.reduce((sum, grade) => {
      const percentage = calculatePercentage(grade.score, grade.max_score);
      const weight = grade.weight || 1;
      return sum + (percentage * weight);
    }, 0);
    const totalWeight = subjectGrades.reduce((sum, grade) => sum + (grade.weight || 1), 0);
    const average = totalWeighted / totalWeight;
    return { subject, average, grades: subjectGrades };
  });

  // Calculate overall average
  const overallAverage = subjectAverages.length > 0
    ? subjectAverages.reduce((sum, s) => sum + s.average, 0) / subjectAverages.length
    : 0;

  const stats = {
    total: grades.length,
    subjects: Object.keys(gradesBySubject).length,
    average: Math.round(overallAverage),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat nilai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Nilai</h1>
        <p className="text-muted-foreground">Daftar nilai dan performa akademik Anda</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-primary" />
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Nilai</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-5 w-5 text-info" />
                <Badge variant="info">{stats.subjects}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.subjects}</p>
              <p className="text-xs text-muted-foreground">Mata Pelajaran</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <Badge variant="success">{stats.average}%</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.average}%</p>
              <p className="text-xs text-muted-foreground">Rata-rata</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grades by Subject */}
      {subjectAverages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Belum ada nilai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subjectAverages.map((subjectData, i) => (
            <motion.div
              key={subjectData.subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{subjectData.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getGradeColor(subjectData.average)}`}>
                        {Math.round(subjectData.average)}%
                      </span>
                      <Badge variant="outline" className="text-lg">
                        {getGradeLabel(subjectData.average)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subjectData.grades.map((grade) => {
                      const percentage = calculatePercentage(grade.score, grade.max_score);
                      return (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm capitalize">
                              {grade.type === 'midterm' ? 'UTS' : grade.type === 'final' ? 'UAS' : grade.type}
                            </p>
                            {grade.note && (
                              <p className="text-xs text-muted-foreground mt-1">{grade.note}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {grade.score}/{grade.max_score}
                            </span>
                            <span className={`font-bold ${getGradeColor(percentage)}`}>
                              {percentage}%
                            </span>
                            <Badge variant="outline">{getGradeLabel(percentage)}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
