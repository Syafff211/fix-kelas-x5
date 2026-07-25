'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelola Settings</h1>
          <p className="text-muted-foreground">Manajemen settings kelas X-5</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Baru
        </Button>
      </motion.div>
      <Card>
        <CardContent className="pt-6 text-center py-16">
          <p className="text-lg text-muted-foreground">🚧 Panel admin settings - Fitur lengkap tersedia di versi produksi</p>
        </CardContent>
      </Card>
    </div>
  );
}
