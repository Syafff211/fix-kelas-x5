'use client';

import { motion } from 'framer-motion';
import { Crown, Users, BookOpen, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLandingContent } from '@/hooks/useLandingContent';

interface OrganizationMember {
  position: string;
  name: string;
  description?: string;
  order: number;
}

const iconMap: Record<string, any> = {
  'Ketua Kelas': Crown,
  'Wakil Ketua': Users,
  'Sekretaris': BookOpen,
  'Bendahara': Calculator,
};

const colorMap: Record<string, string> = {
  'Ketua Kelas': 'text-yellow-500',
  'Wakil Ketua': 'text-blue-500',
  'Sekretaris': 'text-green-500',
  'Bendahara': 'text-purple-500',
};

export function OfficersSection() {
  const { getContent, loading } = useLandingContent();

  // Fetch organization data
  const membersJson = getContent('organization', 'members', '[]');
  let members: OrganizationMember[] = [];

  try {
    members = JSON.parse(membersJson);
  } catch (error) {
    console.error('Error parsing organization data:', error);
  }

  // Sort by order
  members.sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <section id="officers" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pengurus <span className="text-gradient">Kelas</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-32 skeleton rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null; // Don't show section if no members
  }

  return (
    <section id="officers" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Pengurus <span className="text-gradient">Kelas</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Tim yang memimpin dan mengorganisir kegiatan kelas
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {members.map((member, i) => {
            const Icon = iconMap[member.position] || Users;
            const color = colorMap[member.position] || 'text-primary';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="text-center hover:glow-primary transition-all duration-500 group">
                  <CardContent className="pt-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Icon className={`h-10 w-10 ${color}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{member.name || 'Belum Diisi'}</h3>
                    <Badge variant="outline">{member.position}</Badge>
                    {member.description && (
                      <p className="text-xs text-muted-foreground mt-2">{member.description}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
