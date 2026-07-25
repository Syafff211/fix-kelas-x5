'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DEFAULT_PASSWORD = 'ganesha123';

export default function BulkCreatePage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });

  const runBulkCreate = async () => {
    setRunning(true);
    setResults([]);
    setStats({ total: 0, success: 0, error: 0 });

    try {
      const response = await fetch('/api/admin/bulk-create-auth', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bulk-create-secret-key-2026',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create users');
      }

      setStats({
        total: data.total || 0,
        success: data.successCount || 0,
        error: data.errorCount || 0,
      });

      setResults(data.results || []);

      toast.success(`Selesai! ${data.successCount} berhasil, ${data.errorCount} error`);
    } catch (error: any) {
      console.error('Bulk create error:', error);
      toast.error('Error: ' + error.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Bulk Create Auth Users
        </h1>
        <p className="text-muted-foreground mt-1">
          Buat auth users untuk semua students yang belum punya akun login
        </p>
      </motion.div>

      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Users className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Informasi:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                <li>Password default: <code className="bg-black/20 px-2 py-0.5 rounded">{DEFAULT_PASSWORD}</code></li>
                <li>Hanya profile dengan <code className="bg-black/20 px-2 py-0.5 rounded">user_id = null</code> yang akan diproses</li>
                <li>Email akan otomatis di-confirm</li>
                <li>Proses bisa memakan waktu beberapa menit untuk banyak users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress</span>
            {stats.total > 0 && (
              <div className="flex gap-2">
                <Badge variant="outline">Total: {stats.total}</Badge>
                <Badge variant="success">Success: {stats.success}</Badge>
                <Badge variant="error">Error: {stats.error}</Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runBulkCreate}
            disabled={running}
            className="w-full mb-4"
            size="lg"
          >
            {running ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Mulai Bulk Create
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-success/10 border-success/20'
                      : 'bg-destructive/10 border-destructive/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium text-sm">{result.email}</span>
                  </div>
                  {result.error && (
                    <p className="text-xs text-destructive mt-1 ml-6">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {stats.success > 0 && !running && (
        <Card className="bg-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="text-sm text-success">
                <p className="font-semibold mb-1">Berhasil!</p>
                <p className="text-success/80">
                  {stats.success} students sekarang bisa login dengan password: <code className="bg-black/20 px-2 py-0.5 rounded">{DEFAULT_PASSWORD}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
