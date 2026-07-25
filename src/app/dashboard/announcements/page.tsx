'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Pin, Calendar, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const supabase = createClient();

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  created_at: string;
  author?: {
    full_name: string;
  };
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!created_by(full_name)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'pinned' && ann.is_pinned);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: id });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat pengumuman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Pengumuman
          </h1>
          <p className="text-muted-foreground mt-1">
            Informasi terbaru dari kelas X-5
          </p>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pengumuman..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Semua
                </Button>
                <Button
                  variant={filter === 'pinned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pinned')}
                >
                  <Pin className="h-4 w-4 mr-2" />
                  Pinned
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery || filter !== 'all'
                  ? 'Tidak ada pengumuman yang sesuai'
                  : 'Belum ada pengumuman'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement, i) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`hover:glow-primary transition-all ${announcement.is_pinned ? 'border-primary/30 bg-primary/5' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.is_pinned && (
                          <Badge variant="warning" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(announcement.created_at)}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      {announcement.author && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Oleh: {announcement.author.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {announcement.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
