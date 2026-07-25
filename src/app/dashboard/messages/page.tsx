'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MoreVertical, MessageCircle, Users, Phone, Video, Archive,
  ArrowLeft, Smile, Paperclip, Send, Mic, Check, CheckCheck
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

export default function StudentMessagesPage() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // FIX SCROLL: ref untuk container pesan & tracker posisi scroll
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const isFirstLoadRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // SCROLL HANDLER: cek apakah user lagi di bawah atau lagi scroll ke atas baca chat lama
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 120;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      isAtBottomRef.current = nearBottom;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedChat]);

  // Hanya auto-scroll ke bawah kalau user memang sedang di bawah / baru buka chat
  const scrollToBottomSmooth = useCallback((force = false) => {
    if (force || isAtBottomRef.current || isFirstLoadRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: force ? 'auto' : 'smooth', block: 'end' });
      });
      if (isFirstLoadRef.current) isFirstLoadRef.current = false;
    }
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
      const mapped: ChatUser[] = students.map(s => {
        const last = lastMap.get(s.id);
        return {
          id: s.id, full_name: s.full_name, avatar_url: s.avatar_url,
          last_message: last?.content || '', last_message_time: last?.created_at,
          unread_count: unreadMap.get(s.id) || 0, is_online: getOnlineStatus(s.updated_at), last_seen: s.updated_at
        };
      });
      mapped.sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime(); });
      setChatUsers(mapped);
    } finally { if (isInitial) setInitialLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchChatUsers(true);
    const interval = setInterval(() => fetchChatUsers(false), 20000);
    const ch = supabase.channel(`wa_list_${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchChatUsers(false)).subscribe();
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
        // paksa scroll ke bawah pas pertama buka chat
        setTimeout(() => scrollToBottomSmooth(true), 50);
        await supabase.from('messages').update({ is_read: true }).eq('sender_id', selectedChat).eq('receiver_id', user.id).eq('is_read', false);
        setChatUsers(prev => prev.map(u => u.id === selectedChat ? { ...u, unread_count: 0 } : u));
      }
    };
    fetchMessages();

    const ch = supabase.channel(`wa_chat_${user.id}_${selectedChat}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        if ((m.sender_id === user.id && m.receiver_id === selectedChat) || (m.sender_id === selectedChat && m.receiver_id === user.id)) {
          setMessages(prev => {
            if (prev.some(x => x.id === m.id)) return prev;
            return [...prev, m];
          });
          // auto scroll hanya jika user lagi di bawah
          setTimeout(() => scrollToBottomSmooth(false), 50);
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const um = payload.new as Message;
        setMessages(prev => prev.map(x => x.id === um.id ? { ...x, ...um } : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedChat, user?.id, scrollToBottomSmooth]);

  // Auto scroll pas messages bertambah, tapi hormati posisi user
  useEffect(() => {
    if (messages.length > 0) scrollToBottomSmooth(false);
  }, [messages, scrollToBottomSmooth]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    // paksa scroll ke bawah pas kita yang ngirim
    isAtBottomRef.current = true;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, sender_id: user.id, receiver_id: selectedChat, content, created_at: new Date().toISOString(), is_read: false, sender: { full_name: user.full_name || 'You' } };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottomSmooth(true);

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
      <div className="h-[calc(100dvh-8rem)] flex items-center justify-center bg-[#111b21] rounded-xl">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#8696a0] text-sm">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-8rem)] md:h-[calc(100vh-8rem)] flex bg-[#111b21] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#222d34] relative">
      {/* Sidebar */}
      <div className={`w-full md:w-[400px] flex flex-col bg-[#111b21] border-r border-[#222d34] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-[59px] bg-[#202c33] flex items-center justify-between px-4 flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold">{user?.full_name?.charAt(0) || 'A'}</div>
          <div className="flex items-center gap-4 text-[#aebac1]">
            <Users className="h-5 w-5 cursor-pointer" />
            <MessageCircle className="h-5 w-5 cursor-pointer" />
            <MoreVertical className="h-5 w-5 cursor-pointer" />
          </div>
        </div>

        <div className="p-3 bg-[#111b21]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
            <input
              placeholder="Cari atau mulai chat baru"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[35px] pl-10 pr-3 bg-[#202c33] rounded-lg text-[14px] text-[#d1d7db] placeholder:text-[#8696a0] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(u => {
            const active = selectedChat === u.id;
            return (
              <button key={u.id} onClick={() => setSelectedChat(u.id)} className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#202c33] text-left border-b border-[#222d34]/50 ${active ? 'bg-[#2a3942]' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className="h-[49px] w-[49px] rounded-full bg-[#313d45] flex items-center justify-center text-white font-medium text-[19px]">{u.full_name.charAt(0).toUpperCase()}</div>
                  {u.is_online && <div className="absolute bottom-0 right-0 h-[12px] w-[12px] bg-[#00a884] rounded-full border-[2.5px] border-[#111b21]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className="text-[#e9edef] text-[17px] truncate">{u.full_name}</span>
                    <span className={`text-[12px] flex-shrink-0 ml-2 ${u.unread_count ? 'text-[#00a884] font-bold' : 'text-[#8696a0]'}`}>{formatListTime(u.last_message_time)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[13px] text-[#8696a0] truncate pr-2">{u.last_message || 'Belum ada pesan'}</span>
                    {u.unread_count ? <span className="bg-[#00a884] text-[#111b21] text-[12px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">{u.unread_count}</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area - FIX UTAMA DI SINI */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#0b141a] ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat && selectedUser ? (
          <>
            <div className="h-[59px] bg-[#202c33] flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden text-[#aebac1]" onClick={() => setSelectedChat(null)}><ArrowLeft className="h-6 w-6" /></button>
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[#313d45] flex items-center justify-center text-white font-medium">{selectedUser.full_name.charAt(0).toUpperCase()}</div>
                  {selectedUser.is_online && <div className="absolute bottom-0 right-0 h-[10px] w-[10px] bg-[#00a884] rounded-full border-2 border-[#202c33]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[#e9edef] font-semibold text-[16px] truncate flex items-center gap-2">
                    {selectedUser.full_name}
                    {selectedUser.is_online && <span className="h-2 w-2 bg-[#00a884] rounded-full animate-pulse inline-block" />}
                  </div>
                  <div className={`text-[13px] truncate ${selectedUser.is_online ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
                    {getLastSeenText(selectedUser.last_seen, selectedUser.is_online)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[#aebac1]"><Video className="h-5 w-5" /><Phone className="h-5 w-5" /><MoreVertical className="h-5 w-5" /></div>
            </div>

            {/* container pesan - pakai ref sendiri, scroll tidak ikut ketik */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-[5%] py-4 space-y-1 overscroll-contain"
              style={{
                backgroundColor: '#0b141a',
                backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                backgroundRepeat: 'repeat',
              }}
            >
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isOwn = msg.sender_id === user?.id;
                    const prev = messages[idx - 1];
                    const showDate = !prev || formatListTime(prev.created_at) !== formatListTime(msg.created_at);
                    const today = isToday(new Date(msg.created_at));
                    const yest = isYesterday(new Date(msg.created_at));
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-[#182533] text-[#8696a0] text-[12.5px] px-3 py-1 rounded-[7.5px] shadow">
                              {today ? 'HARI INI' : yest ? 'KEMARIN' : format(new Date(msg.created_at), 'd MMMM yyyy', { locale: id }).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`relative max-w-[75%] md:max-w-[60%] rounded-[7.5px] px-2.5 pt-1.5 pb-5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${isOwn ? 'bg-[#005c4b] rounded-tr-none text-[#e9edef]' : 'bg-[#202c33] rounded-tl-none text-[#e9edef]'}`}>
                            <span className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{msg.content}</span>
                            <span className="absolute bottom-1 right-2 flex items-center gap-1">
                              <span className="text-[11px] text-[#8696a0]">{format(new Date(msg.created_at), 'HH:mm')}</span>
                              {isOwn && <span>{msg.is_read ? <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" /> : <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />}</span>}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                {/* anchor bawah */}
                <div ref={messagesEndRef} className="h-0" />
              </div>
            </div>

            {/* Input - fixed bottom, tidak bikin scroll atas */}
            <div className="bg-[#202c33] px-3 py-[5px] flex items-center gap-2 flex-shrink-0">
              <button className="h-10 w-10 rounded-full flex items-center justify-center text-[#8696a0] hover:bg-white/10"><Smile className="h-6 w-6" /></button>
              <button className="h-10 w-10 rounded-full flex items-center justify-center text-[#8696a0] hover:bg-white/10"><Paperclip className="h-5 w-5 rotate-[-45deg]" /></button>
              <input
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ketik pesan"
                className="flex-1 h-10 bg-[#2a3942] rounded-lg px-3 text-[15px] text-[#d1d7db] placeholder:text-[#8696a0] focus:outline-none"
                disabled={sending}
              />
              <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="h-11 w-11 rounded-full bg-[#00a884] hover:bg-[#06cf9c] flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50">
                {newMessage.trim() ? <Send className="h-5 w-5 ml-0.5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#222e35] border-b-[6px] border-b-[#00a884]">
            <div className="text-center px-8 max-w-[420px]">
              <div className="h-[160px] w-[160px] rounded-full bg-[#182533] mx-auto mb-6 flex items-center justify-center"><MessageCircle className="h-16 w-16 text-[#3b4a54]" /></div>
              <h2 className="text-[20px] text-[#d1d7db] font-light mb-2">WhatsApp Web</h2>
              <p className="text-[14px] text-[#8696a0]">Pilih chat untuk mulai mengirim pesan. Pesanmu terenkripsi end-to-end.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
