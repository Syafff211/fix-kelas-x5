'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { format, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';

const supabase = createClient();

interface Assignment {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  due_date: string;
  file_url?: string;
  created_at: string;
  submissions?: {
    id: string;
    submitted_at: string;
  }[];
}

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          submissions:assignment_submissions(id, submitted_at)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
    if (filter === 'pending') return !isSubmitted;
    if (filter === 'submitted') return isSubmitted;
    return true;
  });

  const getStatusBadge = (assignment: Assignment) => {
    const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
    const dueDate = new Date(assignment.due_date);
    const isOverdue = isPast(dueDate) && !isToday(dueDate) && !isSubmitted;

    if (isSubmitted) {
      return { variant: 'success' as const, label: 'Sudah Dikumpulkan', icon: CheckCircle };
    } else if (isOverdue) {
      return { variant: 'destructive' as const, label: 'Terlewat', icon: AlertCircle };
    } else if (isToday(dueDate)) {
      return { variant: 'warning' as const, label: 'Hari Ini', icon: Clock };
    } else {
      return { variant: 'outline' as const, label: 'Belum Dikumpulkan', icon: Clock };
    }
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !a.submissions || a.submissions.length === 0).length,
    submitted: assignments.filter(a => a.submissions && a.submissions.length > 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat tugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Tugas</h1>
        <p className="text-muted-foreground">Daftar tugas yang harus dikerjakan</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Tugas</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <Badge variant="warning">{stats.pending}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Belum Dikumpulkan</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <Badge variant="success">{stats.submitted}</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
              <p className="text-xs text-muted-foreground">Sudah Dikumpulkan</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Semua
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Belum Dikumpulkan
          </Button>
          <Button
            variant={filter === 'submitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('submitted')}
          >
            Sudah Dikumpulkan
          </Button>
        </div>
      </motion.div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {assignments.length === 0
                ? 'Belum ada tugas'
                : 'Tidak ada tugas yang sesuai dengan filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map((assignment, i) => {
            const status = getStatusBadge(assignment);
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:glow-primary transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {assignment.subject && (
                            <Badge variant="outline">{assignment.subject}</Badge>
                          )}
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline: {format(new Date(assignment.due_date), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                        </div>
                        {assignment.submissions && assignment.submissions.length > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>Dikumpulkan: {format(new Date(assignment.submissions[0].submitted_at), 'dd MMM yyyy', { locale: id })}</span>
                          </div>
                        )}
                      </div>
                      {assignment.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-2" />
                            Lihat File
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
