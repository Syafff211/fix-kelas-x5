'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  FileText,
  BookOpen,
  Award,
  Bell,
  Image as ImageIcon,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  GraduationCap,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { PresenceIndicator } from '@/components/PresenceIndicator';

const supabase = createClient();

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Kehadiran', href: '/dashboard/attendance' },
  { icon: FileText, label: 'Tugas', href: '/dashboard/assignments' },
  { icon: BookOpen, label: 'Materi', href: '/dashboard/materials' },
  { icon: Award, label: 'Nilai', href: '/dashboard/grades' },
  { icon: Bell, label: 'Pengumuman', href: '/dashboard/announcements' },
  { icon: ImageIcon, label: 'Galeri', href: '/dashboard/gallery' },
  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', badge: 'New' },
  { icon: Users, label: 'Teman', href: '/dashboard/friends' },
  { icon: Calendar, label: 'Jadwal', href: '/dashboard/schedule' },
];

export function StudentNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch unread notifications
    const fetchNotifications = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(count || 0);
    };

    // Fetch unread messages
    const fetchMessages = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setMessages(count || 0);
    };

    fetchNotifications();
    fetchMessages();

    // Real-time subscription for notifications
    const notifChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Real-time subscription for messages
    const msgChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user]);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-sm">X-5 SMAN 1</h1>
                  <p className="text-xs text-muted-foreground -mt-0.5">Purbalingga</p>
                </div>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari tugas, materi, teman..."
                  className="w-full h-9 pl-10 pr-4 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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

              {/* Presence Indicator */}
              <PresenceIndicator showCount={true} maxDisplay={3} />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 hover:bg-primary/10 transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="icon" className="h-10 w-10 relative hover:bg-primary/10 transition-colors">
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
              <Link href="/dashboard/messages">
                <Button variant="ghost" size="icon" className="h-10 w-10 relative hover:bg-primary/10 transition-colors">
                  <MessageSquare className="h-5 w-5" />
                  {messages > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-1 text-[10px] font-bold animate-pulse"
                    >
                      {messages > 9 ? '9+' : messages}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 h-9 px-2 hover:bg-primary/10 transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                      {user?.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.full_name?.split(' ')[0] || 'Siswa'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />

                      {/* Dropdown */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-background/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user?.avatar_url} />
                              <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                                {user?.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{user?.full_name || 'Siswa'}</p>
                              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            href="/dashboard/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            <span className="text-sm">Profil Saya</span>
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            <span className="text-sm">Pengaturan</span>
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
                    </>
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-16 bottom-0 w-[280px] bg-background/95 backdrop-blur-xl border-r border-white/10 z-40 overflow-y-auto"
            >
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
                        <span className="font-medium flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                            {item.badge}
                          </Badge>
                        )}
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
