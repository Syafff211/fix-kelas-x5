'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Save, RotateCcw, Eye, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

const defaultColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  background: '#0a0a0f',
  foreground: '#fafafa',
  muted: '#a1a1aa',
  border: 'rgba(255, 255, 255, 0.08)',
};

export default function AdminThemePage() {
  const [colors, setColors] = useState(defaultColors);
  const [customCSS, setCustomCSS] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const { data: colorData } = await supabase
        .from('landing_content')
        .select('value')
        .eq('section', 'theme')
        .eq('key', 'colors')
        .single();

      const { data: cssData } = await supabase
        .from('landing_content')
        .select('value')
        .eq('section', 'theme')
        .eq('key', 'custom_css')
        .single();

      if (colorData?.value) {
        setColors(JSON.parse(colorData.value));
      }
      if (cssData?.value) {
        setCustomCSS(cssData.value);
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      await supabase.from('landing_content').upsert(
        [
          {
            section: 'theme',
            key: 'colors',
            value: JSON.stringify(colors),
            updated_at: new Date().toISOString(),
          },
          {
            section: 'theme',
            key: 'custom_css',
            value: customCSS,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'section,key' }
      );

      toast.success('Theme berhasil disimpan!');
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetColors = () => {
    setColors(defaultColors);
    toast.info('Warna direset ke default');
  };

  const generateCSS = () => {
    return `:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-foreground: ${colors.foreground};
  --color-muted: ${colors.muted};
  --color-border: ${colors.border};
}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            Theme & Custom CSS
          </h1>
          <p className="text-muted-foreground mt-1">
            Kustomisasi warna dan CSS untuk landing page
          </p>
        </div>
        <Button onClick={saveTheme} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Theme'}
        </Button>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Warna
          </TabsTrigger>
          <TabsTrigger value="css">
            <Code className="h-4 w-4 mr-2" />
            Custom CSS
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Warna Theme</CardTitle>
                <Button variant="outline" size="sm" onClick={resetColors}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr,auto,200px] gap-4 items-center">
                  <Label className="capitalize">{key.replace('_', ' ')}</Label>
                  <div
                    className="w-12 h-12 rounded-lg border border-white/10"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Palette className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                    <li>Gunakan warna hex (#000000) atau rgba untuk transparansi</li>
                    <li>Primary color akan digunakan untuk button dan accent</li>
                    <li>Background color untuk background utama</li>
                    <li>Perubahan akan langsung terlihat setelah disimpan</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="css" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>CSS Code</Label>
                <textarea
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  placeholder={`/* Tambahkan CSS custom di sini */
.hero-section {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.custom-button {
  border-radius: 20px;
  padding: 12px 24px;
}`}
                  className="w-full h-96 p-4 rounded-xl border border-white/10 bg-white/5 font-mono text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Code className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">CSS Variables yang Tersedia:</p>
                  <code className="block bg-black/20 p-3 rounded-lg text-xs">
                    --color-primary, --color-secondary, --color-accent,<br />
                    --color-background, --color-foreground, --color-muted, --color-border
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-xl bg-black/40 border border-white/10 overflow-x-auto">
                <code className="text-sm text-green-400">{generateCSS()}</code>
              </pre>
              {customCSS && (
                <>
                  <div className="my-4 border-t border-white/10" />
                  <pre className="p-4 rounded-xl bg-black/40 border border-white/10 overflow-x-auto">
                    <code className="text-sm text-blue-400">{customCSS}</code>
                  </pre>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Palette Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-full aspect-square rounded-xl border border-white/10 mb-2"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-sm font-medium capitalize">{key.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground font-mono">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
