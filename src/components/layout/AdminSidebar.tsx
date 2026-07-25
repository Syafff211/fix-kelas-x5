'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Calendar,
  FileText,
  BookOpen,
  Award,
  Image,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Layout,
  Crown,
  Palette,
  UserPlus,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Kelola Siswa', href: '/admin/students' },
  { icon: UserPlus, label: 'Bulk Create Users', href: '/admin/bulk-create', badge: 'New' },
  { icon: Calendar, label: 'Kehadiran', href: '/admin/attendance' },
  { icon: FileText, label: 'Tugas', href: '/admin/assignments' },
  { icon: BookOpen, label: 'Materi', href: '/admin/materials' },
  { icon: Award, label: 'Nilai', href: '/admin/grades' },
  { icon: Image, label: 'Galeri', href: '/admin/gallery' },
  { icon: Bell, label: 'Pengumuman', href: '/admin/announcements' },
  { icon: Calendar, label: 'Kalender', href: '/admin/calendar' },
  { icon: Crown, label: 'Struktur Organisasi', href: '/admin/organization' },
  { icon: Layout, label: 'Landing CMS', href: '/admin/landing' },
  { icon: Palette, label: 'Theme & CSS', href: '/admin/theme' },
  { icon: Database, label: 'Database', href: '/admin/database' },
  { icon: Settings, label: 'Pengaturan', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/admin';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass border border-white/10"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0 }}
        className="fixed left-0 top-0 z-40 h-screen w-[280px] glass border-r border-white/10 overflow-y-auto"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">X-5 SMAN 1 Purbalingga</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer',
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          {user && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {user.full_name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
