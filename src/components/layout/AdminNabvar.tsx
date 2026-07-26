'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Bell,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  Shield,
  ChevronDown,
  Users,
  Calendar,
  FileText,
  BookOpen,
  Award,
  Image,
  Crown,
  Layout,
  Palette,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Kelola Siswa', href: '/admin/students' },
  { icon: Calendar, label: 'Kehadiran', href: '/admin/attendance' },
  { icon: FileText, label: 'Tugas', href: '/admin/assignments' },
  { icon: BookOpen, label: 'Materi', href: '/admin/materials' },
  { icon: Award, label: 'Nilai', href: '/admin/grades' },
  { icon: Image, label: 'Galeri', href: '/admin/gallery' },
  { icon: Bell, label: 'Pengumuman', href: '/admin/announcements' },
  { icon: Calendar, label: 'Kalender', href: '/admin/calendar' },
  { icon: Crown, label: 'Organisasi', href: '/admin/organization' },
  { icon: MessageSquare, label: 'Messages', href: '/admin/messages' },
  { icon: Layout, label: 'Landing CMS', href: '/admin/landing' },
  { icon: Palette, label: 'Theme & CSS', href: '/admin/theme' },
  { icon: Database, label: 'Database', href: '/admin/database' },
  { icon: Settings, label: 'Pengaturan', href: '/admin/settings' },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(5); // Mock data
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/admin';
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <Link href="/admin" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-sm">Admin Panel</h1>
                  <p className="text-xs text-muted-foreground -mt-0.5">X-5 SMAN 1 Purbalingga</p>
                </div>
              </Link>

              {/* Admin Badge */}
              <Badge variant="destructive" className="hidden sm:flex ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            </div>

            {/* Center: Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa, tugas, pengumuman..."
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button (Mobile) */}
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Search className="h-5 w-5" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <Link href="/admin/notifications">
                <Button variant="ghost" size="icon" className="h-10 w-10 relative hover:bg-primary/10">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-1 text-[10px] font-bold animate-pulse"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Messages */}
              <Link href="/admin/messages">
                <Button variant="ghost" size="icon" className="h-10 w-10 relative hover:bg-primary/10">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 h-9 px-2"
                >
                  <div className="h-7 w-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-semibold text-sm">
                    {user?.full_name?.charAt(0) || 'A'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.full_name?.split(' ')[0] || 'Admin'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 glass rounded-xl border border-white/10 shadow-xl overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-lg">
                            {user?.full_name?.charAt(0) || 'A'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{user?.full_name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            <Badge variant="destructive" className="mt-1 text-[10px]">
                              Super Admin
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/admin/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span className="text-sm">Profil Saya</span>
                        </Link>
                        <Link
                          href="/admin/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span className="text-sm">Pengaturan</span>
                        </Link>
                        <Link
                          href="/"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Layout className="h-4 w-4" />
                          <span className="text-sm">Lihat Landing Page</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-16 bottom-0 w-[280px] glass border-r border-white/10 z-40 overflow-y-auto"
            >
              {/* Admin Badge */}
              <div className="p-4 border-b border-white/10">
                <Badge variant="destructive" className="w-full justify-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              </div>

              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
