'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Type, Image, Palette, Layout, Save, Eye, Search as SearchIcon, Settings, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLandingCMS, useFileUpload } from '@/hooks/useSupabase';
import { toast } from 'sonner';

const sections = [
  { id: 'hero', label: 'Hero Section', icon: Globe },
  { id: 'about', label: 'About / Visi & Misi', icon: Type },
  { id: 'stats', label: 'Statistics', icon: Layout },
  { id: 'contact', label: 'Contact Info', icon: Type },
  { id: 'seo', label: 'SEO Settings', icon: SearchIcon },
  { id: 'theme', label: 'Theme & Design', icon: Palette },
  { id: 'footer', label: 'Footer', icon: Settings },
  { id: 'social', label: 'Social Media', icon: Globe },
];

export default function AdminLandingCMSPage() {
  const { content, settings, loading, updateContent, updateSetting, refetch } = useLandingCMS();
  const { uploadFile, uploading } = useFileUpload('landing-assets');
  const [activeSection, setActiveSection] = useState('hero');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const values: Record<string, string> = {};
    content.forEach(c => { values[`${c.section}.${c.key}`] = c.value; });
    settings.forEach(s => { values[`setting.${s.key}`] = s.value; });
    setFormValues(values);
  }, [content, settings]);

  const getValue = (section: string, key: string) => formValues[`${section}.${key}`] || '';
  const getSetting = (key: string) => formValues[`setting.${key}`] || '';

  const setValue = (path: string, value: string) => setFormValues(prev => ({ ...prev, [path]: value }));

  const saveContent = async (section: string, key: string) => {
    setSaving(true);
    const value = getValue(section, key);
    await updateContent(section, key, value);
    setSaving(false);
  };

  const saveSetting = async (key: string, category: string) => {
    setSaving(true);
    const value = getSetting(key);
    await updateSetting(key, value, category);
    setSaving(false);
  };

  const handleFileUpload = async (file: File, section: string, key: string) => {
    const url = await uploadFile(file);
    if (url) {
      setValue(`${section}.${key}`, url);
      await updateContent(section, key, url, 'image_url');
    }
  };

  const renderField = (section: string, key: string, label: string, type: 'text' | 'textarea' | 'image' = 'text') => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {type === 'textarea' ? (
        <textarea className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" rows={3} value={getValue(section, key)} onChange={e => setValue(`${section}.${key}`, e.target.value)} />
      ) : type === 'image' ? (
        <div className="space-y-2">
          <Input value={getValue(section, key)} onChange={e => setValue(`${section}.${key}`, e.target.value)} placeholder="URL gambar atau upload di bawah" />
          <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/50 cursor-pointer text-sm">
            <Image className="h-4 w-4" />
            <span>Upload gambar</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, section, key); }} />
          </label>
          {getValue(section, key) && <img src={getValue(section, key)} alt="" className="w-full h-32 object-cover rounded-xl" />}
        </div>
      ) : (
        <Input value={getValue(section, key)} onChange={e => setValue(`${section}.${key}`, e.target.value)} />
      )}
      <Button size="sm" variant="outline" onClick={() => saveContent(section, key)} disabled={saving}>
        <Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );

  const renderSettingField = (key: string, label: string, category: string, type: 'text' | 'color' = 'text') => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {type === 'color' && <Input type="color" value={getSetting(key)} onChange={e => setValue(`setting.${key}`, e.target.value)} className="w-16 h-11" />}
        <Input value={getSetting(key)} onChange={e => setValue(`setting.${key}`, e.target.value)} className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => saveSetting(key, category)} disabled={saving}><Save className="h-3 w-3" /></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Page CMS</h1>
          <p className="text-muted-foreground">Edit semua konten landing page tanpa coding</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <a href="/" target="_blank"><Button variant="outline"><Eye className="h-4 w-4 mr-2" />Preview</Button></a>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 p-2">
            <div className="space-y-1">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${activeSection === s.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}>
                  <s.icon className="h-4 w-4 shrink-0" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sections.find(s => s.id === activeSection)?.label}
              <Badge variant="success">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
            ) : (
              <div className="space-y-6">
                {activeSection === 'hero' && (
                  <>
                    {renderField('hero', 'title', 'Hero Title')}
                    {renderField('hero', 'subtitle', 'Hero Subtitle')}
                    {renderField('hero', 'description', 'Hero Description', 'textarea')}
                    {renderField('hero', 'button_text', 'Button Text')}
                    {renderField('hero', 'button_link', 'Button Link')}
                    {renderField('hero', 'background_image', 'Background Image', 'image')}
                  </>
                )}
                {activeSection === 'about' && (
                  <>
                    {renderField('about', 'vision', 'Visi', 'textarea')}
                    {renderField('about', 'mission', 'Misi (satu per baris)', 'textarea')}
                    {renderField('about', 'motto', 'Motto Kelas')}
                    {renderField('about', 'description', 'Deskripsi Kelas', 'textarea')}
                  </>
                )}
                {activeSection === 'stats' && (
                  <>
                    {renderField('stats', 'total_students', 'Total Siswa')}
                    {renderField('stats', 'attendance_rate', 'Kehadiran (%)')}
                    {renderField('stats', 'achievements', 'Jumlah Prestasi')}
                    {renderField('stats', 'subjects', 'Jumlah Mata Pelajaran')}
                  </>
                )}
                {activeSection === 'contact' && (
                  <>
                    {renderField('contact', 'address', 'Alamat')}
                    {renderField('contact', 'phone', 'Telepon')}
                    {renderField('contact', 'email', 'Email')}
                    {renderField('contact', 'maps_url', 'Google Maps Embed URL')}
                  </>
                )}
                {activeSection === 'seo' && (
                  <>
                    {renderSettingField('seo_title', 'Meta Title', 'seo')}
                    {renderSettingField('seo_description', 'Meta Description', 'seo')}
                    {renderSettingField('seo_keywords', 'Keywords', 'seo')}
                  </>
                )}
                {activeSection === 'theme' && (
                  <>
                    {renderSettingField('accent_color', 'Accent Color', 'theme', 'color')}
                    {renderSettingField('site_name', 'Website Name', 'general')}
                    <div className="space-y-2">
                      <Label>Website Logo</Label>
                      {renderField('theme', 'logo', 'Logo URL', 'image')}
                    </div>
                    <div className="space-y-2">
                      <Label>School Logo</Label>
                      {renderField('theme', 'school_logo', 'Logo Sekolah URL', 'image')}
                    </div>
                  </>
                )}
                {activeSection === 'footer' && (
                  <>
                    {renderField('footer', 'copyright', 'Copyright Text')}
                    {renderField('footer', 'description', 'Footer Description', 'textarea')}
                    {renderSettingField('footer_text', 'Footer Tagline', 'footer')}
                  </>
                )}
                {activeSection === 'social' && (
                  <>
                    {renderField('social', 'instagram', 'Instagram URL')}
                    {renderField('social', 'facebook', 'Facebook URL')}
                    {renderField('social', 'twitter', 'Twitter/X URL')}
                    {renderField('social', 'youtube', 'YouTube URL')}
                    {renderField('social', 'tiktok', 'TikTok URL')}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
