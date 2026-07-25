'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export default function Page() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Halaman settings akan segera tersedia</p>
      </motion.div>
      <Card>
        <CardContent className="pt-6 text-center py-16">
          <p className="text-lg text-muted-foreground">🚧 Fitur ini sedang dalam pengembangan</p>
        </CardContent>
      </Card>
    </div>
  );
}
