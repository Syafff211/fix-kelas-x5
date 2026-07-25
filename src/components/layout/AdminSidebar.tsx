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
  Crown,
  Layout,
  Palette,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/admin', badge: null },
  { icon: Users, label: 'Kelola Siswa', href: '/admin/students', badge: null },
  { icon: Calendar, label: 'Kehadiran', href: '/admin/attendance', badge: null },
  { icon: FileText, label: 'Tugas', href: '/admin/assignments', badge: '5' },
  { icon: BookOpen, label: 'Materi', href: '/admin/materials', badge: null },
  { icon: Award, label: 'Nilai', href: '/admin/grades', badge: null },
  { icon: Image, label: 'Galeri', href: '/admin/gallery', badge: null },
  { icon: Bell, label: 'Pengumuman', href: '/admin/announcements', badge: '3' },
  { icon: Calendar, label: 'Kalender', href: '/admin/calendar', badge: null },
  { icon: Crown, label: 'Organisasi', href: '/admin/organization', badge: null },
  { icon: MessageSquare, label: 'Messages', href: '/admin/messages', badge: 'New' },
  { icon: Layout, label: 'Landing CMS', href: '/admin/landing', badge: null },
  { icon: Palette, label: 'Theme & CSS', href: '/admin/theme', badge: null },
  { icon: Database, label: 'Database', href: '/admin/database', badge: null },
  { icon: Settings, label: 'Pengaturan', href: '/admin/settings', badge: null },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        animate={{ 
          x: isOpen ? 0 : typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0,
          width: isCollapsed ? 80 : 280
        }}
        className="fixed left-0 top-0 z-40 h-screen glass border-r border-white/10 overflow-hidden flex flex-col"
      >
        {/* Logo & Collapse Button */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm truncate">Admin Panel</h1>
                <p className="text-xs text-muted-foreground truncate">X-5 SMAN 1 Purbalingga</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Admin Badge */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <Badge variant="destructive" className="w-full justify-center">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer',
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badge === 'New' ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        {user && (
          <div className="p-3 border-t border-white/10">
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-semibold flex-shrink-0">
                    {user.full_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">Super Admin</p>
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
              </>
            ) : (
              <div className="flex flex-col gap-2 items-center">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-semibold">
                  {user.full_name?.charAt(0) || 'A'}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.aside>
    </>
  );
}
