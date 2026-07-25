'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MoreVertical, MessageCircle, Users, Archive, ArrowLeft, 
  Smile, Paperclip, Send, Check, CheckCheck, X, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const supabase = createClient();

interface Message {
  id: string; sender_id: string; receiver_id: string; content: string;
  created_at: string; is_read: boolean; sender?: { full_name: string };
}
interface ChatUser {
  id: string; full_name: string; avatar_url?: string; last_message?: string;
  last_message_time?: string; unread_count?: number; is_online?: boolean; last_seen?: string;
}

const EMOJIS = [
  '😀','😃','😄','😁','😆','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗',
  '😙','😚','🥺','😢','😭','😮‍💨','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰',
  '😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲',
  '🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🥳','🥸','😎','🤓','🧐',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💝',
  '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋','🙏','💪','🔥','🎉','✨','⭐','💯'
];

export default function StudentMessagesPage() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // FIX SCROLL - anti loncat
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const isFirstLoadRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const getOnlineStatus = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return differenceInMinutes(new Date(), new Date(lastSeen)) < 3;
  };

  const getLastSeenText = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'terakhir dilihat baru-baru ini';
    const date = new Date(lastSeen);
    const time = format(date, 'HH:mm');
    if (isToday(date)) return `terakhir dilihat hari ini pukul ${time}`;
    if (isYesterday(date)) return `terakhir dilihat kemarin pukul ${time}`;
    return `terakhir dilihat ${format(date, 'd MMM', { locale: id })} pukul ${time}`;
  };

  const formatListTime = (ds?: string) => {
    if (!ds) return '';
    const d = new Date(ds);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Kemarin';
    return format(d, 'dd/MM');
  };

  // Scroll listener
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      isAtBottomRef.current = nearBottom;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedChat]);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current || isFirstLoadRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: force ? 'auto' : 'smooth', block: 'end' });
      });
      isFirstLoadRef.current = false;
    }
  }, []);

  // close emoji when click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-emoji-btn]')) setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchChatUsers = useCallback(async (isInitial = false) => {
    if (!user?.id) return;
    if (isInitial) setInitialLoading(true);
    try {
      const { data: students } = await supabase.from('profiles').select('id, full_name, avatar_url, updated_at').eq('role','student').neq('id', user.id).order('full_name');
      if (!students) { setChatUsers([]); return; }
      const { data: allMessages } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
      const lastMap = new Map<string, any>();
      const unreadMap = new Map<string, number>();
      (allMessages || []).forEach(m => {
        const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!lastMap.has(other)) lastMap.set(other, m);
        if (m.receiver_id === user.id && m.sender_id === other && !m.is_read) unreadMap.set(other, (unreadMap.get(other) || 0) + 1);
      });
      const mapped: ChatUser[] = students.map(s => ({
        id: s.id, full_name: s.full_name, avatar_url: s.avatar_url,
        last_message: lastMap.get(s.id)?.content || '', last_message_time: lastMap.get(s.id)?.created_at,
        unread_count: unreadMap.get(s.id) || 0, is_online: getOnlineStatus(s.updated_at), last_seen: s.updated_at
      }));
      mapped.sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime(); });
      setChatUsers(mapped);
    } finally { if (isInitial) setInitialLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchChatUsers(true);
    const interval = setInterval(() => fetchChatUsers(false), 20000);
    const ch = supabase.channel(`chat_list_${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchChatUsers(false)).subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(ch); };
  }, [user?.id, fetchChatUsers]);

  useEffect(() => {
    if (!selectedChat || !user?.id) return;
    isFirstLoadRef.current = true;
    isAtBottomRef.current = true;
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select(`*, sender:profiles!sender_id(full_name)`).or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
      if (data) {
        setMessages(data as Message[]);
        setTimeout(() => scrollToBottom(true), 60);
        await supabase.from('messages').update({ is_read: true }).eq('sender_id', selectedChat).eq('receiver_id', user.id).eq('is_read', false);
        setChatUsers(prev => prev.map(u => u.id === selectedChat ? { ...u, unread_count: 0 } : u));
      }
    };
    fetchMessages();
    const ch = supabase.channel(`chat_${user.id}_${selectedChat}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        const m = p.new as Message;
        if ((m.sender_id === user.id && m.receiver_id === selectedChat) || (m.sender_id === selectedChat && m.receiver_id === user.id)) {
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          setTimeout(() => scrollToBottom(false), 60);
          if (m.sender_id === selectedChat) supabase.from('messages').update({ is_read: true }).eq('id', m.id).then();
          setChatUsers(prev => {
            const upd = prev.map(u => {
              const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
              return u.id === other ? { ...u, last_message: m.content, last_message_time: m.created_at } : u;
            });
            return [...upd].sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime()-new Date(a.last_message_time).getTime(); });
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (p) => {
        const um = p.new as Message;
        setMessages(prev => prev.map(x => x.id === um.id ? { ...x, ...um } : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedChat, user?.id, scrollToBottom]);

  useEffect(() => { if (messages.length) scrollToBottom(false); }, [messages, scrollToBottom]);

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) { setNewMessage(prev => prev + emoji); return; }
    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? newMessage.length;
    const text = newMessage.substring(0, start) + emoji + newMessage.substring(end);
    setNewMessage(text);
    setTimeout(() => { input.focus(); input.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    setShowEmoji(false);
    isAtBottomRef.current = true;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, sender_id: user.id, receiver_id: selectedChat, content, created_at: new Date().toISOString(), is_read: false };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom(true);
    try {
      const { data, error } = await supabase.from('messages').insert([{ sender_id: user.id, receiver_id: selectedChat, content, is_read: false }]).select().single();
      if (error) throw error;
      if (data) setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m));
      setChatUsers(prev => {
        const upd = prev.map(u => u.id === selectedChat ? { ...u, last_message: content, last_message_time: new Date().toISOString() } : u);
        return [...upd].sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime()-new Date(a.last_message_time).getTime(); });
      });
    } catch (e: any) {
      toast.error('Gagal mengirim: ' + e.message);
      setNewMessage(content);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const filtered = chatUsers.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedUser = chatUsers.find(u => u.id === selectedChat);

  if (initialLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100dvh-8rem)] flex gap-4 p-2">
        <div className="w-full md:w-[360px] bg-white dark:bg-[#1a1c1e] rounded-[20px] border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-4">
          <div className="h-10 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
          {[1,2,3,4,5].map(i=><div key={i} className="flex gap-3"><div className="h-12 w-12 rounded-full bg-black/5 dark:bg-white/5 animate-pulse" /><div className="flex-1 space-y-2"><div className="h-4 w-3/4 bg-black/5 dark:bg-white/5 rounded animate-pulse" /><div className="h-3 w-1/2 bg-black/5 dark:bg-white/5 rounded animate-pulse" /></div></div>)}
        </div>
        <div className="flex-1 bg-white dark:bg-[#1a1c1e] rounded-[20px] border border-black/[0.06] dark:border-white/[0.06] hidden md:flex items-center justify-center">
          <div className="h-10 w-10 border-[3px] border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25,0.1,0.25,1] }}
      className="h-[calc(100dvh-8rem)] md:h-[calc(100vh-8rem)] flex gap-3 p-2 md:p-3 bg-[#f5f5f7] dark:bg-[#0a0a0b] rounded-[24px]"
    >
      {/* SIDEBAR - ORIGINAL, BUKAN WA */}
      <motion.div 
        layout
        className={`w-full md:w-[380px] flex flex-col bg-white dark:bg-[#181a1e] rounded-[20px] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#111] dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-[14px]">{user?.full_name?.charAt(0) || 'A'}</div>
              <div>
                <h1 className="text-[18px] font-semibold tracking-tight text-[#111] dark:text-white">Pesan</h1>
                <p className="text-[12px] text-black/50 dark:text-white/50">{filtered.length} percakapan • {chatUsers.filter(c=>c.is_online).length} online</p>
              </div>
            </div>
            <button className="h-9 w-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] flex items-center justify-center transition-colors"><MoreVertical className="h-4 w-4" /></button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30 dark:text-white/30 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Cari teman..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#f2f2f4] dark:bg-[#222529] border border-transparent focus:bg-white dark:focus:bg-[#2a2d31] focus:border-black/10 dark:focus:border-white/10 focus:outline-none focus:ring-4 focus:ring-black/[0.04] dark:focus:ring-white/[0.04] text-[14px] transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1 scrollbar-thin">
          <AnimatePresence>
            {filtered.map((u, i) => {
              const active = selectedChat === u.id;
              return (
                <motion.button
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.02, duration: 0.25 }}
                  onClick={() => setSelectedChat(u.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-[14px] text-left transition-all relative group
                    ${active ? 'bg-[#111] dark:bg-white text-white dark:text-black shadow-[0_8px_20px_rgba(0,0,0,0.12)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#111] dark:text-white'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`h-[44px] w-[44px] rounded-full flex items-center justify-center font-medium text-[15px] transition-colors ${active ? 'bg-white/15 dark:bg-black/10 text-white dark:text-black' : 'bg-[#eceef0] dark:bg-[#2a2e32] text-[#333] dark:text-[#d1d7db]'}`}>
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    {u.is_online && <div className="absolute -bottom-0.5 -right-0.5 h-[13px] w-[13px] bg-[#22c55e] rounded-full border-[3px] border-white dark:border-[#181a1e]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-[14.5px] font-medium leading-none ${active ? 'text-white dark:text-black' : 'text-[#111] dark:text-white'}`}>{u.full_name}</span>
                      <span className={`text-[11px] flex-shrink-0 ${active ? 'text-white/60 dark:text-black/60' : 'text-black/40 dark:text-white/40'}`}>{formatListTime(u.last_message_time)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className={`truncate text-[12.5px] leading-[16px] ${active ? 'text-white/70 dark:text-black/60' : 'text-black/50 dark:text-white/50'}`}>{u.last_message || 'Belum ada pesan'}</span>
                      {u.unread_count ? <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${active ? 'bg-white text-black dark:bg-black dark:text-white' : 'bg-[#111] dark:bg-white text-white dark:text-black'}`}>{u.unread_count}</span> : null}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* CHAT AREA - ORIGINAL */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#181a1e] rounded-[20px] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden min-w-0 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat && selectedUser ? (
          <>
            {/* Header tanpa telp/video call */}
            <div className="h-[64px] px-5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0 bg-white/80 dark:bg-[#181a1e]/80 backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSelectedChat(null)} className="md:hidden h-9 w-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-[#111] dark:bg-white text-white dark:text-black flex items-center justify-center font-medium text-[14px]">{selectedUser.full_name.charAt(0).toUpperCase()}</div>
                  {selectedUser.is_online && <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-[#22c55e] rounded-full border-2 border-white dark:border-[#181a1e]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold text-[#111] dark:text-white truncate flex items-center gap-2">
                    {selectedUser.full_name}
                    {selectedUser.is_online && <span className="h-1.5 w-1.5 bg-[#22c55e] rounded-full animate-pulse" />}
                  </div>
                  <div className={`text-[12px] truncate ${selectedUser.is_online ? 'text-[#16a34a] dark:text-[#22c55e]' : 'text-black/50 dark:text-white/50'}`}>
                    {getLastSeenText(selectedUser.last_seen, selectedUser.is_online)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"><Search className="h-4 w-4 text-black/60 dark:text-white/60" /></button>
                <button className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"><MoreVertical className="h-4 w-4 text-black/60 dark:text-white/60" /></button>
              </div>
            </div>

            {/* Messages - smooth */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-6 space-y-3 bg-[#fafafa] dark:bg-[#101214] overscroll-contain scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => {
                  const isOwn = m.sender_id === user?.id;
                  const prev = messages[idx - 1];
                  const showDate = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-6">
                          <span className="px-3 py-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-[11px] font-medium tracking-wide text-black/50 dark:text-white/50">
                            {isToday(new Date(m.created_at)) ? 'Hari ini' : isYesterday(new Date(m.created_at)) ? 'Kemarin' : format(new Date(m.created_at), 'd MMMM yyyy', { locale: id })}
                          </span>
                        </motion.div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.22, ease: [0.25,0.1,0.25,1] }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`group relative max-w-[78%] md:max-w-[62%] px-4 py-2.5 rounded-[18px] text-[14px] leading-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]
                          ${isOwn ? 'bg-[#111] dark:bg-white text-white dark:text-black rounded-br-[6px]' : 'bg-white dark:bg-[#23262a] border border-black/[0.06] dark:border-white/[0.06] text-[#111] dark:text-white rounded-bl-[6px]'}`}>
                          <span className="whitespace-pre-wrap break-words">{m.content}</span>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10.5px] ${isOwn ? 'text-white/60 dark:text-black/50' : 'text-black/40 dark:text-white/40'}`}>{format(new Date(m.created_at), 'HH:mm')}</span>
                            {isOwn && <span className="ml-0.5">{m.is_read ? <CheckCheck className="h-3.5 w-3.5 text-white/80 dark:text-black/60" /> : <Check className="h-3.5 w-3.5 text-white/50 dark:text-black/40" />}</span>}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-0" />
            </div>

            {/* Input + Emoji Picker */}
            <div className="relative border-t border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#181a1e] p-3 flex-shrink-0">
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    ref={emojiRef}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute bottom-[60px] left-3 right-3 md:right-auto md:w-[360px] max-h-[300px] overflow-hidden bg-white dark:bg-[#23262a] rounded-[18px] shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-black/[0.08] dark:border-white/[0.08] z-20 flex flex-col"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                      <span className="text-[13px] font-medium">Emoji</span>
                      <button onClick={()=>setShowEmoji(false)} className="h-7 w-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="overflow-y-auto p-3 grid grid-cols-8 gap-1 flex-1">
                      {EMOJIS.map(e=>(
                        <button key={e} onClick={()=>insertEmoji(e)} className="h-9 w-9 rounded-[10px] hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-[20px] transition-colors active:scale-90">
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1">
                  <button data-emoji-btn onClick={()=>setShowEmoji(v=>!v)} className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${showEmoji ? 'bg-[#111] dark:bg-white text-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10 text-black/50 dark:text-white/50'}`}>
                    <Smile className="h-5 w-5" />
                  </button>
                  <button className="h-10 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-black/40 dark:text-white/40 transition-colors">
                    <Paperclip className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={newMessage}
                    onChange={e=>setNewMessage(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }}
                    placeholder="Ketik pesan..."
                    className="w-full h-[44px] rounded-full bg-[#f2f2f4] dark:bg-[#23262a] border border-transparent focus:bg-white dark:focus:bg-[#2a2d31] focus:border-black/10 dark:focus:border-white/10 focus:outline-none focus:ring-4 focus:ring-black/[0.04] dark:focus:ring-white/[0.06] px-4 pr-12 text-[14.5px] placeholder:text-black/30 dark:placeholder:text-white/30 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-black/20 dark:text-white/20 hidden md:block">↵</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-11 w-11 rounded-full bg-[#111] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)] disabled:opacity-40 disabled:shadow-none transition-all"
                >
                  <Send className="h-[18px] w-[18px] ml-[2px]" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-8 bg-[#fafafa] dark:bg-[#101214]">
            <div className="text-center max-w-[320px]">
              <div className="h-20 w-20 rounded-[20px] bg-[#111] dark:bg-white mx-auto mb-5 flex items-center justify-center shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                <MessageCircle className="h-9 w-9 text-white dark:text-black" />
              </div>
              <h3 className="text-[18px] font-semibold tracking-tight">Pilih percakapan</h3>
              <p className="text-[13.5px] leading-5 text-black/50 dark:text-white/50 mt-2">Pilih teman di sebelah kiri untuk mulai ngobrol dengan teman.</p>
              <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-black/30 dark:text-white/30">
                <Sparkles className="h-3.5 w-3.5" /> End-to-end encrypted
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
