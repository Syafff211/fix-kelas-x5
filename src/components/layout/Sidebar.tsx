'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  BookOpen,
  FileText,
  Award,
  Bell,
  Image,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useUIStore } from '@/store';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const studentMenuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Kehadiran', href: '/dashboard/attendance' },
  { icon: FileText, label: 'Tugas', href: '/dashboard/assignments' },
  { icon: BookOpen, label: 'Materi', href: '/dashboard/materials' },
  { icon: Award, label: 'Nilai', href: '/dashboard/grades' },
  { icon: Bell, label: 'Pengumuman', href: '/dashboard/announcements' },
  { icon: Image, label: 'Galeri', href: '/dashboard/gallery' },
  { icon: Calendar, label: 'Jadwal', href: '/dashboard/schedule' },
  { icon: MessageSquare, label: 'Pesan', href: '/dashboard/messages' },
  { icon: User, label: 'Profil', href: '/dashboard/profile' },
  { icon: Settings, label: 'Pengaturan', href: '/dashboard/settings' },
];

const adminMenuItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: User, label: 'Kelola Siswa', href: '/admin/students' },
  { icon: Calendar, label: 'Kehadiran', href: '/admin/attendance' },
  { icon: FileText, label: 'Tugas', href: '/admin/assignments' },
  { icon: BookOpen, label: 'Materi', href: '/admin/materials' },
  { icon: Award, label: 'Nilai', href: '/admin/grades' },
  { icon: Image, label: 'Galeri', href: '/admin/gallery' },
  { icon: Bell, label: 'Pengumuman', href: '/admin/announcements' },
  { icon: Calendar, label: 'Kalender', href: '/admin/calendar' },
  { icon: Shield, label: 'Landing CMS', href: '/admin/landing' },
  { icon: Settings, label: 'Pengaturan', href: '/admin/settings' },
];

interface SidebarProps {
  type: 'student' | 'admin';
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuItems = type === 'admin' ? adminMenuItems : studentMenuItems;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex items-center justify-between border-b border-white/10", isMobile ? "h-16 px-4" : "h-20 px-6")}>
        {(sidebarOpen || isMobile) && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              {type === 'admin' ? <Shield className="h-4 w-4 text-white" /> : <GraduationCap className="h-4 w-4 text-white" />}
            </div>
            <div>
              <h1 className="text-sm font-bold text-gradient">X-5 SMAN 1</h1>
              <p className="text-[10px] text-muted-foreground">Purbalingga</p>
            </div>
          </div>
        )}
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 hidden lg:flex">
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </Button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link href={item.href} onClick={() => isMobile && setMobileOpen(false)}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {(sidebarOpen || isMobile) && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      {(sidebarOpen || isMobile) && user && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 rounded-xl glass flex items-center justify-center border border-white/10"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] glass border-r border-white/10 lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 z-40 h-screen glass border-r border-white/10 hidden lg:block"
      >
        {sidebarContent(false)}
      </motion.aside>
    </>
  );
}
