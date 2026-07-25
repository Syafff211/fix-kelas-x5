'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStudents } from '@/hooks/useSupabase';
import { Badge } from '@/components/ui/badge';

export default function StudentFriendsPage() {
  const { students, loading } = useStudents();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Teman Sekelas
        </h1>
        <p className="text-muted-foreground mt-1">
          Daftar semua siswa kelas X-5
        </p>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-32 skeleton rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="hover:glow-primary transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                      {student.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{student.full_name}</h3>
                        {student.class_position && (
                          <Badge variant="default" className="gap-1 shrink-0 text-[10px]">
                            👑 {student.class_position}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">NISN: {student.nisn || '-'}</p>
                      <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      {student.phone && <p className="text-xs text-muted-foreground mt-1">📱 {student.phone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && students.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada teman terdaftar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
