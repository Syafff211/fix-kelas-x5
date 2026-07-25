'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MoreVertical, MessageCircle, Users, Phone, Video, 
  ArrowLeft, Smile, Paperclip, Send, Mic, Check, CheckCheck,
  MessageSquarePlus, CircleDashed
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const supabase = createClient();

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: { full_name: string; avatar_url?: string };
}

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  is_online?: boolean;
  last_seen?: string;
}

export default function WhatsappStudentMessagesPage() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // === HELPER: Online logic ===
  const getOnlineStatus = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = differenceInMinutes(new Date(), new Date(lastSeen));
    return diff < 3; // anggap online kalau aktif <3 menit
  };

  // === HELPER: Format terakhir dilihat ala WA ===
  const getLastSeenText = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return { text: 'Online', online: true };
    if (!lastSeen) return { text: 'terakhir dilihat baru-baru ini', online: false };

    const date = new Date(lastSeen);
    const time = format(date, 'HH:mm'); // sesuai request kamu 14:30

    if (isToday(date)) {
      return { text: `terakhir dilihat hari ini pukul ${time}`, online: false };
    }
    if (isYesterday(date)) {
      return { text: `terakhir dilihat kemarin pukul ${time}`, online: false };
    }
    // kalau beda hari
    return { 
      text: `terakhir dilihat ${format(date, 'd MMM', { locale: id })} pukul ${time}`, 
      online: false 
    };
  };

  const formatListTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'dd/MM/yyyy');
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const fetchChatUsers = useCallback(async (isInitial = false) => {
    if (!user?.id) return;
    if (isInitial) setInitialLoading(true);

    try {
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, updated_at')
        .eq('role', 'student')
        .neq('id', user.id)
        .order('full_name');

      if (!students) {
        setChatUsers([]);
        return;
      }

      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const lastMap = new Map<string, any>();
      const unreadMap = new Map<string, number>();

      (allMessages || []).forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!lastMap.has(otherId)) lastMap.set(otherId, msg);
        if (msg.receiver_id === user.id && msg.sender_id === otherId && !msg.is_read) {
          unreadMap.set(otherId, (unreadMap.get(otherId) || 0) + 1);
        }
      });

      const mapped: ChatUser[] = students.map(s => {
        const last = lastMap.get(s.id);
        const online = getOnlineStatus(s.updated_at);
        return {
          id: s.id,
          full_name: s.full_name,
          avatar_url: s.avatar_url,
          last_message: last?.content || '',
          last_message_time: last?.created_at,
          unread_count: unreadMap.get(s.id) || 0,
          is_online: online,
          last_seen: s.updated_at,
        };
      });

      mapped.sort((a,b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });

      setChatUsers(mapped);
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchChatUsers(true);
    const interval = setInterval(() => fetchChatUsers(false), 15000);

    const listChannel = supabase
      .channel(`wa_list_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchChatUsers(false))
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(listChannel);
    };
  }, [user?.id, fetchChatUsers]);

  useEffect(() => {
    if (!selectedChat || !user?.id) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`*, sender:profiles!sender_id(full_name, avatar_url)`)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as Message[]);
        scrollToBottom();
        await supabase.from('messages').update({ is_read: true }).eq('sender_id', selectedChat).eq('receiver_id', user.id).eq('is_read', false);
        setChatUsers(prev => prev.map(u => u.id === selectedChat ? { ...u, unread_count: 0 } : u));
      }
    };

    fetchMessages();

    const channel = supabase.channel(`wa_chat_${user.id}_${selectedChat}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        if ((m.sender_id === user.id && m.receiver_id === selectedChat) || (m.sender_id === selectedChat && m.receiver_id === user.id)) {
          setMessages(prev => {
            if (prev.some(x => x.id === m.id)) return prev;
            return [...prev, { ...m, sender: { full_name: m.sender_id === user.id ? (user.full_name||'You') : (chatUsers.find(u=>u.id===selectedChat)?.full_name||'') } }];
          });
          scrollToBottom();
          if (m.sender_id === selectedChat) {
            supabase.from('messages').update({ is_read: true }).eq('id', m.id).then();
          }
          setChatUsers(prev => {
            const upd = prev.map(u => {
              const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
              return u.id === otherId ? { ...u, last_message: m.content, last_message_time: m.created_at } : u;
            });
            return [...upd].sort((a,b)=> {
              if(!a.last_message_time) return 1;
              if(!b.last_message_time) return -1;
              return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
            });
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const um = payload.new as Message;
        setMessages(prev => prev.map(x => x.id === um.id ? { ...x, ...um } : x));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChat, user?.id, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId, sender_id: user.id, receiver_id: selectedChat,
      content, created_at: new Date().toISOString(), is_read: false,
      sender: { full_name: user.full_name || 'You' }
    };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();

    try {
      const { data, error } = await supabase.from('messages').insert([{ sender_id: user.id, receiver_id: selectedChat, content, is_read: false }]).select().single();
      if (error) throw error;
      if (data) setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: { full_name: user.full_name||'You' } } as Message : m));
      setChatUsers(prev => {
        const upd = prev.map(u => u.id === selectedChat ? { ...u, last_message: content, last_message_time: new Date().toISOString() } : u);
        return [...upd].sort((a,b)=> {
          if(!a.last_message_time) return 1;
          if(!b.last_message_time) return -1;
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
      });
    } catch (e:any) {
      toast.error('Gagal mengirim pesan: ' + e.message);
      setNewMessage(content);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const filtered = chatUsers.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'unread') return matchSearch && (u.unread_count||0) > 0;
    return matchSearch;
  });

  const selectedUser = chatUsers.find(u => u.id === selectedChat);
  const lastSeenInfo = selectedUser ? getLastSeenText(selectedUser.last_seen, selectedUser.is_online) : null;

  if (initialLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-[#111b21] rounded-lg">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8696a0] text-sm">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-[#111b21] rounded-lg overflow-hidden shadow-2xl border border-[#222d34] font-[Segoe_UI,Helvetica,Arial,sans-serif]">
      {/* SIDEBAR */}
      <div className={`w-full md:w-[430px] flex flex-col bg-[#111b21] border-r border-[#222d34] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="h-[59px] bg-[#202c33] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
          </div>
          <div className="flex items-center gap-5 text-[#aebac1]">
            <CircleDashed className="h-5 w-5 cursor-pointer" />
            <MessageCircle className="h-5 w-5 cursor-pointer" />
            <MessageSquarePlus className="h-5 w-5 cursor-pointer" />
            <MoreVertical className="h-5 w-5 cursor-pointer" />
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#111b21] border-b border-[#222d34]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-[#8696a0]" />
            <input
              placeholder="Cari atau mulai chat baru"
              className="w-full h-9 pl-12 pr-4 bg-[#202c33] rounded-lg text-[14px] text-[#d1d7db] placeholder:text-[#8696a0] focus:outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setFilterTab('all')} className={`px-3 py-1.5 rounded-full text-xs ${filterTab==='all' ? 'bg-[#00a884] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'}`}>Semua</button>
            <button onClick={() => setFilterTab('unread')} className={`px-3 py-1.5 rounded-full text-xs ${filterTab==='unread' ? 'bg-[#00a884] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'}`}>Belum dibaca</button>
            <button className="px-3 py-1.5 rounded-full text-xs bg-[#2a3942] text-[#8696a0]">Grup</button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-[#8696a0] text-sm">Tidak ada chat</div>
          ) : (
            filtered.map(u => {
              const isActive = selectedChat === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedChat(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#202c33] transition-colors text-left ${isActive ? 'bg-[#2a3942]' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-[49px] w-[49px] rounded-full bg-[#6b7c8f] flex items-center justify-center text-white font-medium text-[19px]">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    {u.is_online && (
                      <div className="absolute bottom-0 right-0 h-[13px] w-[13px] bg-[#00a884] rounded-full border-[2.5px] border-[#111b21]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 border-b border-[#222d34] pb-3">
                    <div className="flex justify-between items-center">
                      <div className="font-normal text-[17px] text-[#e9edef] truncate">{u.full_name}</div>
                      <div className="flex items-center gap-1">
                        {u.last_message_time && (
                          <div className={`text-[12px] ${u.unread_count ? 'text-[#00a884] font-bold' : 'text-[#8696a0]'}`}>
                            {formatListTime(u.last_message_time)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1 min-w-0">
                        {/* check */}
                        {u.last_message && (
                          <span className="text-[#8696a0] text-[13px] truncate flex items-center gap-1">
                            {u.last_message_time && <CheckCheck className="h-3 w-3 flex-shrink-0" />}
                            <span className="truncate">{u.last_message}</span>
                          </span>
                        )}
                        {!u.last_message && <span className="text-[#8696a0] text-[13px] italic">Belum ada pesan</span>}
                      </div>
                      {u.unread_count ? (
                        <div className="bg-[#00a884] text-[#111b21] text-[12px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 ml-2">
                          {u.unread_count}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat && selectedUser ? (
          <>
            {/* Header Chat */}
            <div className="h-[59px] bg-[#202c33] flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden text-[#aebac1]" onClick={() => setSelectedChat(null)}><ArrowLeft className="h-6 w-6" /></button>
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[#6b7c8f] flex items-center justify-center text-white font-medium">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  {selectedUser.is_online && (
                    <div className="absolute bottom-0 right-0 h-[10px] w-[10px] bg-[#00a884] rounded-full border-2 border-[#202c33]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[16px] text-[#e9edef] truncate flex items-center gap-1">
                    {selectedUser.full_name}
                    {selectedUser.is_online && <div className="h-2 w-2 bg-[#00a884] rounded-full ml-2 animate-pulse" />}
                  </div>
                  <div className={`text-[13px] truncate ${lastSeenInfo?.online ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
                    {lastSeenInfo?.text}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[#aebac1]">
                <Video className="h-5 w-5 cursor-pointer" />
                <Phone className="h-5 w-5 cursor-pointer" />
                <Search className="h-5 w-5 cursor-pointer hidden md:block" />
                <MoreVertical className="h-5 w-5 cursor-pointer" />
              </div>
            </div>

            {/* Messages Bg */}
            <div className="flex-1 overflow-y-auto px-[5%] md:px-[8%] py-4 space-y-1 relative"
              style={{
                backgroundColor: '#0b141a',
                backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '400px'
              }}
            >
              <div className="absolute inset-0 bg-[#0b141a]/90 pointer-events-none" />
              <div className="relative z-10 space-y-1">
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const isOwn = msg.sender_id === user?.id;
                    const prev = messages[idx - 1];
                    const showDate = !prev || formatListTime(prev.created_at) !== formatListTime(msg.created_at) || idx === 0;
                    const isTodayMsg = isToday(new Date(msg.created_at));
                    const isYestMsg = isYesterday(new Date(msg.created_at));
                    
                    return (
                      <div key={msg.id} className="relative">
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <div className="bg-[#182533] text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-[7.5px] shadow-sm">
                              {isTodayMsg ? 'HARI INI' : isYestMsg ? 'KEMARIN' : format(new Date(msg.created_at), 'd MMMM yyyy', { locale: id }).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`relative max-w-[65%] md:max-w-[55%] rounded-[7.5px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${isOwn ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#202c33] rounded-tl-none'}`}>
                            {/* tail */}
                            <span className={`absolute top-0 ${isOwn ? 'right-[-8px] w-0 h-0 border-l-[8px] border-l-[#005c4b] border-t-[8px] border-t-[#005c4b] border-r-0 border-b-0' : 'left-[-8px] w-0 h-0 border-r-[8px] border-r-[#202c33] border-t-[8px] border-t-[#202c33]'}`} />
                            <div className="px-2.5 pt-1.5 pb-1">
                              <div className="text-[14.2px] leading-[19.5px] text-[#e9edef] whitespace-pre-wrap break-words pr-14">
                                {msg.content}
                              </div>
                              <div className="flex items-center justify-end gap-1 -mt-1 float-right ml-2">
                                <span className="text-[11px] leading-none text-[#8696a0] whitespace-nowrap select-none">
                                  {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                                {isOwn && (
                                  <span className="ml-1">
                                    {msg.is_read ? <CheckCheck className="h-[14px] w-[14px] text-[#53bdeb]" /> : <CheckCheck className="h-[14px] w-[14px] text-[#8696a0]" />}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="bg-[#202c33] px-4 py-[5px] flex items-end gap-3 flex-shrink-0">
              <div className="flex items-center gap-4 text-[#8696a0] pb-3">
                <Smile className="h-[26px] w-[26px] cursor-pointer" />
                <Paperclip className="h-[26px] w-[26px] cursor-pointer rotate-[-45deg]" />
              </div>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  placeholder="Ketik pesan"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }}}
                  disabled={sending}
                  className="w-full bg-[#2a3942] rounded-[8px] px-3 py-3 text-[15px] text-[#d1d7db] placeholder:text-[#8696a0] focus:outline-none resize-none"
                />
              </div>
              <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="bg-[#00a884] hover:bg-[#06cf9c] rounded-full h-11 w-11 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-60">
                {newMessage.trim() ? <Send className="h-5 w-5 text-white ml-[2px]" /> : <Mic className="h-5 w-5 text-white" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#222e35] relative"
            style={{
              backgroundColor: '#222e35',
              borderBottom: '6px solid #00a884'
            }}
          >
            <div className="text-center max-w-[460px] px-8">
              <div className="w-[303px] h-[303px] mx-auto mb-7 rounded-full bg-[#182029] flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-[#0a332c]/30" />
                <MessageCircle className="h-28 w-28 text-[#3b4a54] relative z-10" />
              </div>
              <h1 className="text-[32px] font-extralight text-[#d1d7db] mb-3">WhatsApp Web</h1>
              <p className="text-[14px] text-[#8696a0] leading-[20px]">
                Kirim dan terima pesan tanpa harus tetap terhubung dengan ponsel.<br/>
                Gunakan WhatsApp di hingga 4 perangkat tertaut dan 1 ponsel secara bersamaan.
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-[#667781] text-sm">
                <span className="h-3 w-3 rounded-full bg-[#00a884] inline-block animate-pulse" /> Enkripsi end-to-end
              </div>
              {/* Online users indicator */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#182533] rounded-full text-xs text-[#8696a0]">
                <Users className="h-4 w-4" />
                {chatUsers.filter(u=>u.is_online).length} teman sedang online
                <div className="flex -space-x-1">
                  {chatUsers.filter(u=>u.is_online).slice(0,3).map(u=>(
                    <div key={u.id} className="h-5 w-5 rounded-full bg-[#00a884] border-2 border-[#182533] flex items-center justify-center text-[10px] text-white font-bold">
                      {u.full_name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
