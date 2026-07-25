'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MoreVertical, MessageCircle, ArrowLeft, 
  Smile, Paperclip, Send, Check, CheckCheck, X
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
  '😀','😃','😄','😁','😆','😂','🤣','🥲','😊','😇','🙂','😉','😌','😍','🥰','😘',
  '🥺','😢','😭','😮‍💨','😤','😡','🤯','😳','😱','🤗','🤔','🤫','😶','🙄','😴',
  '🥳','😎','🤓','❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💞','👍','👎','👌','🔥','🎉','✨','⭐','💯','🙏','💪'
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        const t = e.target as HTMLElement;
        if (!t.closest('[data-emoji-btn]')) setShowEmoji(false);
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
    const ch = supabase.channel(`list_${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchChatUsers(false)).subscribe();
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
      <div className="h-[calc(100dvh-8rem)] flex gap-3 p-3 bg-[#09090b]">
        <div className="w-full md:w-[360px] bg-[#141416] rounded-[20px] border border-[#232326] p-4 space-y-4">
          <div className="h-11 bg-[#1e1e21] rounded-full animate-pulse" />
          {[1,2,3,4,5].map(i=><div key={i} className="flex gap-3"><div className="h-11 w-11 rounded-full bg-[#1e1e21] animate-pulse" /><div className="flex-1 space-y-2"><div className="h-4 w-3/4 bg-[#1e1e21] rounded" /><div className="h-3 w-1/2 bg-[#1e1e21] rounded" /></div></div>)}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="h-[calc(100dvh-8rem)] md:h-[calc(100vh-8rem)] flex gap-3 p-2 md:p-3 bg-[#09090b] rounded-[24px]"
    >
      {/* SIDEBAR - MODERN DARK */}
      <div className={`w-full md:w-[380px] flex flex-col bg-[#141416] rounded-[20px] border border-[#232326] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-[13px] text-white">{user?.full_name?.charAt(0) || 'A'}</div>
              <div>
                <h1 className="text-[16px] font-semibold tracking-tight text-zinc-100">Pesan</h1>
                <p className="text-[11px] text-zinc-400">{filtered.length} chat • {chatUsers.filter(c=>c.is_online).length} online</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Cari teman..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#1e1e21] border border-[#2a2a2e] focus:border-violet-500/50 focus:bg-[#222227] focus:outline-none focus:ring-4 focus:ring-violet-500/10 text-[13.5px] text-zinc-200 placeholder:text-zinc-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-[2px]">
          {filtered.map((u, i) => {
            const active = selectedChat === u.id;
            return (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedChat(u.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-[14px] text-left transition-all group
                  ${active ? 'bg-[#1e1e21] border border-[#2e2e33] shadow-[0_2px_12px_rgba(0,0,0,0.2)]' : 'border border-transparent hover:bg-[#1a1a1e] hover:border-[#232326]'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-medium text-[14px] ${active ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white' : 'bg-[#232326] text-zinc-300 group-hover:bg-[#2a2a30] group-hover:text-white'}`}>
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  {u.is_online && <div className="absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] bg-emerald-500 rounded-full border-[2.5px] border-[#141416] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-[14px] font-[500] ${active ? 'text-zinc-100' : 'text-zinc-200'}`}>{u.full_name}</span>
                    <span className={`text-[11px] flex-shrink-0 ${u.unread_count ? 'text-violet-400 font-bold' : 'text-zinc-500'}`}>{formatListTime(u.last_message_time)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className={`truncate text-[12.5px] ${active ? 'text-zinc-400' : 'text-zinc-500'}`}>{u.last_message || 'Belum ada pesan'}</span>
                    {u.unread_count ? <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.4)]">{u.unread_count}</span> : null}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-[#121214] rounded-[20px] border border-[#232326] overflow-hidden min-w-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat && selectedUser ? (
          <>
            <div className="h-[64px] px-5 flex items-center justify-between border-b border-[#232326] bg-[#141416]/90 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSelectedChat(null)} className="md:hidden h-9 w-9 rounded-full bg-[#1e1e21] flex items-center justify-center text-zinc-400"><ArrowLeft className="h-5 w-5" /></button>
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-medium text-white text-[13px]">{selectedUser.full_name.charAt(0).toUpperCase()}</div>
                  {selectedUser.is_online && <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-[#141416]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-zinc-100 truncate flex items-center gap-2">
                    {selectedUser.full_name}
                    {selectedUser.is_online && <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                  </div>
                  <div className={`text-[11.5px] truncate ${selectedUser.is_online ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {getLastSeenText(selectedUser.last_seen, selectedUser.is_online)}
                  </div>
                </div>
              </div>
              <button className="h-9 w-9 rounded-full bg-[#1e1e21] hover:bg-[#252529] flex items-center justify-center text-zinc-400 transition-colors"><MoreVertical className="h-4 w-4" /></button>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-6 space-y-3 overscroll-contain scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => {
                  const isOwn = m.sender_id === user?.id;
                  const prev = messages[idx - 1];
                  const showDate = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="flex justify-center my-5">
                          <span className="px-3 py-1 rounded-full bg-[#1e1e21] border border-[#232326] text-[11px] font-medium text-zinc-400">
                            {isToday(new Date(m.created_at)) ? 'Hari ini' : isYesterday(new Date(m.created_at)) ? 'Kemarin' : format(new Date(m.created_at), 'd MMMM yyyy', { locale: id })}
                          </span>
                        </div>
                      )}
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[78%] md:max-w-[60%] px-4 py-2.5 rounded-[18px] text-[14px] leading-[20px] 
                          ${isOwn ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-[6px] shadow-[0_4px_16px_rgba(124,58,237,0.25)]' : 'bg-[#1e1e21] border border-[#232326] text-zinc-200 rounded-bl-[6px]'}`}>
                          <span className="whitespace-pre-wrap break-words">{m.content}</span>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10.5px] ${isOwn ? 'text-white/70' : 'text-zinc-500'}`}>{format(new Date(m.created_at), 'HH:mm')}</span>
                            {isOwn && <span className="ml-0.5">{m.is_read ? <CheckCheck className="h-3.5 w-3.5 text-white/90" /> : <Check className="h-3.5 w-3.5 text-white/60" />}</span>}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-0" />
            </div>

            <div className="relative border-t border-[#232326] bg-[#141416] p-3 flex-shrink-0">
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    ref={emojiRef}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute bottom-[64px] left-3 right-3 md:right-auto md:w-[340px] bg-[#1e1e21] rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-[#2a2a30] z-20 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#232326]">
                      <span className="text-[12px] font-semibold text-zinc-200">Emoji</span>
                      <button onClick={()=>setShowEmoji(false)} className="h-6 w-6 rounded-full bg-[#2a2a30] flex items-center justify-center text-zinc-400"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="p-2 grid grid-cols-7 gap-1 max-h-[220px] overflow-y-auto">
                      {EMOJIS.map(e=>(
                        <button key={e} onClick={()=>insertEmoji(e)} className="h-9 w-9 rounded-[10px] hover:bg-[#2a2a30] flex items-center justify-center text-[20px] active:scale-90 transition-all">
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2">
                <button data-emoji-btn onClick={()=>setShowEmoji(v=>!v)} className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${showEmoji ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]' : 'bg-[#1e1e21] hover:bg-[#252529] text-zinc-400 hover:text-zinc-200 border border-[#232326]'}`}>
                  <Smile className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={newMessage}
                    onChange={e=>setNewMessage(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }}
                    placeholder="Ketik pesan..."
                    className="w-full h-[44px] rounded-full bg-[#1e1e21] border border-[#2a2a2e] focus:border-violet-500/50 focus:bg-[#222227] focus:outline-none focus:ring-4 focus:ring-violet-500/10 px-5 text-[14px] text-zinc-100 placeholder:text-zinc-500 transition-all"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-[0_6px_16px_rgba(124,58,237,0.35)] disabled:opacity-40 disabled:shadow-none transition-all"
                >
                  <Send className="h-[18px] w-[18px] ml-[1px]" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-[300px]">
              <div className="h-16 w-16 rounded-[16px] bg-gradient-to-br from-violet-600 to-indigo-600 mx-auto mb-4 flex items-center justify-center shadow-[0_8px_20px_rgba(124,58,237,0.3)]">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-100">Pilih percakapan</h3>
              <p className="text-[13px] leading-5 text-zinc-500 mt-2">Pilih teman di kiri untuk mulai ngobrol.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
