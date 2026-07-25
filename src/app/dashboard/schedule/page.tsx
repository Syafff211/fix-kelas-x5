'use client';

import { motion } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCalendarEvents } from '@/hooks/useSupabase';

export default function StudentSchedulePage() {
  const { events, loading } = useCalendarEvents();

  const typeLabels: Record<string, string> = {
    holiday: 'Libur',
    exam: 'Ujian',
    event: 'Event',
    meeting: 'Rapat',
    other: 'Lainnya',
  };

  const typeBadge: Record<string, string> = {
    holiday: 'success',
    exam: 'danger',
    event: 'primary',
    meeting: 'info',
    other: 'outline',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Jadwal & Event
        </h1>
        <p className="text-muted-foreground mt-1">
          Jadwal kegiatan dan event kelas X-5
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 skeleton rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada jadwal atau event</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:glow-primary transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/20 shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={typeBadge[event.type] as any}>
                          {typeLabels[event.type] || event.type}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      )}
                      {event.time && (
                        <p className="text-xs text-muted-foreground">⏰ {event.time}</p>
                      )}
                    </div>
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
