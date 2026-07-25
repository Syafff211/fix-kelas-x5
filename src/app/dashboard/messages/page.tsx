'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MoreVertical, MessageCircle, Users, Phone, Video, Archive, Star,
  ArrowLeft, Smile, Paperclip, Send, Mic, Check, CheckCheck, Pin,
  MessageSquarePlus, CircleDashed, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const supabase = createClient();

interface Message {
  id: string; sender_id: string; receiver_id: string; content: string;
  created_at: string; is_read: boolean; sender?: { full_name: string; avatar_url?: string };
}
interface ChatUser {
  id: string; full_name: string; avatar_url?: string; last_message?: string;
  last_message_time?: string; unread_count?: number; is_online?: boolean; last_seen?: string;
}

export default function WhatsappPremiumPage() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterTab, setFilterTab] = useState<'all'|'unread'|'group'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getOnlineStatus = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return differenceInMinutes(new Date(), new Date(lastSeen)) < 3;
  };

  const getLastSeenText = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return { text: 'Online', online: true };
    if (!lastSeen) return { text: 'terakhir dilihat baru-baru ini', online: false };
    const date = new Date(lastSeen);
    const time = format(date, 'HH:mm');
    if (isToday(date)) return { text: `terakhir dilihat hari ini pukul ${time}`, online: false };
    if (isYesterday(date)) return { text: `terakhir dilihat kemarin pukul ${time}`, online: false };
    return { text: `terakhir dilihat ${format(date, 'd MMM', { locale: id })} pukul ${time}`, online: false };
  };

  const formatListTime = (ds?: string) => {
    if (!ds) return '';
    const d = new Date(ds);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Kemarin';
    return format(d, 'dd/MM/yy');
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  const fetchChatUsers = useCallback(async (isInitial=false) => {
    if (!user?.id) return;
    if (isInitial) setInitialLoading(true);
    try {
      const { data: students } = await supabase.from('profiles').select('id, full_name, avatar_url, updated_at').eq('role','student').neq('id', user.id).order('full_name');
      if (!students) { setChatUsers([]); return; }
      const { data: allMessages } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at',{ascending:false});
      const lastMap = new Map<string, any>();
      const unreadMap = new Map<string, number>();
      (allMessages||[]).forEach(m => {
        const other = m.sender_id===user.id? m.receiver_id : m.sender_id;
        if (!lastMap.has(other)) lastMap.set(other, m);
        if (m.receiver_id===user.id && m.sender_id===other && !m.is_read) unreadMap.set(other,(unreadMap.get(other)||0)+1);
      });
      const mapped: ChatUser[] = students.map(s => {
        const last = lastMap.get(s.id);
        return { id:s.id, full_name:s.full_name, avatar_url:s.avatar_url, last_message:last?.content||'', last_message_time:last?.created_at, unread_count:unreadMap.get(s.id)||0, is_online:getOnlineStatus(s.updated_at), last_seen:s.updated_at };
      });
      mapped.sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime(); });
      setChatUsers(mapped);
    } finally { if (isInitial) setInitialLoading(false); }
  }, [user?.id]);

  useEffect(()=>{ if(!user?.id) return; fetchChatUsers(true); const i=setInterval(()=>fetchChatUsers(false),15000); const ch=supabase.channel(`wa_premium_${user.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},()=>fetchChatUsers(false)).subscribe(); return ()=>{clearInterval(i); supabase.removeChannel(ch);} },[user?.id,fetchChatUsers]);

  useEffect(()=>{
    if(!selectedChat||!user?.id) return;
    const fetchMessages = async()=>{
      const {data}= await supabase.from('messages').select(`*, sender:profiles!sender_id(full_name, avatar_url)`).or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`).order('created_at',{ascending:true});
      if(data){ setMessages(data as Message[]); scrollToBottom(); await supabase.from('messages').update({is_read:true}).eq('sender_id',selectedChat).eq('receiver_id',user.id).eq('is_read',false); setChatUsers(p=>p.map(u=>u.id===selectedChat?{...u,unread_count:0}:u)); }
    };
    fetchMessages();
    const ch=supabase.channel(`wa_premium_chat_${user.id}_${selectedChat}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},(pl)=>{
      const m=pl.new as Message;
      if((m.sender_id===user.id&&m.receiver_id===selectedChat)||(m.sender_id===selectedChat&&m.receiver_id===user.id)){
        setMessages(prev=>{ if(prev.some(x=>x.id===m.id)) return prev; return [...prev,{...m,sender:{full_name:m.sender_id===user.id?(user.full_name||'You'):(chatUsers.find(u=>u.id===selectedChat)?.full_name||'')}}]; });
        scrollToBottom(); if(m.sender_id===selectedChat) supabase.from('messages').update({is_read:true}).eq('id',m.id).then();
        setChatUsers(prev=>{ const upd=prev.map(u=>{ const other=m.sender_id===user.id? m.receiver_id: m.sender_id; return u.id===other?{...u,last_message:m.content,last_message_time:m.created_at}:u; }); return [...upd].sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime()-new Date(a.last_message_time).getTime(); }); });
      }
    }).on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages'},pl=>{ const um=pl.new as Message; setMessages(prev=>prev.map(x=>x.id===um.id?{...x,...um}:x)); }).subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[selectedChat,user?.id,scrollToBottom]);

  const sendMessage = async()=>{
    if(!newMessage.trim()||!selectedChat||!user?.id||sending) return;
    setSending(true); const content=newMessage.trim(); setNewMessage('');
    const tempId=`temp-${Date.now()}`;
    const optimistic: Message={ id:tempId, sender_id:user.id, receiver_id:selectedChat, content, created_at:new Date().toISOString(), is_read:false, sender:{full_name:user.full_name||'You'} };
    setMessages(p=>[...p,optimistic]); scrollToBottom();
    try{
      const {data,error}= await supabase.from('messages').insert([{sender_id:user.id,receiver_id:selectedChat,content,is_read:false}]).select().single();
      if(error) throw error;
      if(data) setMessages(p=>p.map(m=>m.id===tempId?{...data,sender:{full_name:user.full_name||'You'}} as Message:m));
      setChatUsers(p=>{ const upd=p.map(u=>u.id===selectedChat?{...u,last_message:content,last_message_time:new Date().toISOString()}:u); return [...upd].sort((a,b)=>{ if(!a.last_message_time) return 1; if(!b.last_message_time) return -1; return new Date(b.last_message_time).getTime()-new Date(a.last_message_time).getTime(); }); });
    } catch(e:any){ toast.error('Gagal mengirim: '+e.message); setNewMessage(content); setMessages(p=>p.filter(m=>m.id!==tempId)); } finally{ setSending(false); inputRef.current?.focus(); }
  };

  const filtered = chatUsers.filter(u=>{
    const s=u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    if(filterTab==='unread') return s && (u.unread_count||0)>0;
    return s;
  });
  const selectedUser = chatUsers.find(u=>u.id===selectedChat);
  const lastSeenInfo = selectedUser ? getLastSeenText(selectedUser.last_seen, selectedUser.is_online) : null;

  if(initialLoading){
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center rounded-[20px] bg-[#0a1210] border border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00a884]/10 via-transparent to-[#06cf9c]/10" />
        <div className="text-center relative z-10">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#00a884] to-[#06cf9c] p-[2px] mx-auto mb-5 shadow-[0_0_30px_rgba(0,168,132,0.4)]">
            <div className="h-full w-full rounded-full bg-[#111b21] flex items-center justify-center">
              <div className="h-8 w-8 border-[3px] border-[#00a884] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-[#e9edef] font-medium tracking-wide">Memuat obrolan premium...</p>
          <p className="text-[#8696a0] text-xs mt-1">Enkripsi end-to-end aktif</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-[20px] overflow-hidden bg-[#0a1014] border border-white/[0.06] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)_inset] relative">
      <style>{`
        .premium-scroll::-webkit-scrollbar{width:5px;height:5px}
        .premium-scroll::-webkit-scrollbar-thumb{background:rgba(134,150,160,0.15);border-radius:10px}
        .premium-scroll::-webkit-scrollbar-thumb:hover{background:rgba(0,168,132,0.35)}
        .premium-scroll::-webkit-scrollbar-track{background:transparent}
        .online-glow{box-shadow:0 0 0 2.5px #111b21, 0 0 12px rgba(0,168,132,0.6)}
        .online-pulse::before{content:'';position:absolute;inset:-4px;border-radius:50%;background:#00a884;animation:wa-ping 1.8s cubic-bezier(0,0,0.2,1) infinite}
        @keyframes wa-ping{0%{transform:scale(0.8);opacity:0.8}75%,100%{transform:scale(1.8);opacity:0}}
        .shimmer{position:relative;overflow:hidden}
        .shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);background-size:200% 100%;animation:shimmer 2.2s infinite}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .bubble-own{background:linear-gradient(135deg,#005c4b 0%,#025144 100%);box-shadow:0 2px 8px rgba(0,0,0,0.25),0 1px 2px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.08)}
        .bubble-other{background:linear-gradient(135deg,#202c33 0%,#1f2c34 100%);box-shadow:0 2px 8px rgba(0,0,0,0.22),0 1px 2px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.06)}
      `}</style>

      {/* Gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[200px] -left-[200px] h-[600px] w-[600px] rounded-full bg-[#00a884]/10 blur-[120px]" />
        <div className="absolute -bottom-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#06cf9c]/10 blur-[120px]" />
      </div>

      {/* SIDEBAR */}
      <div className={`w-full md:w-[440px] flex flex-col backdrop-blur-2xl bg-[#111b21]/90 border-r border-white/[0.06] relative z-10 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Premium Header */}
        <div className="h-[64px] bg-[rgba(32,44,51,0.85)] backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#06cf9c] p-[2px] shadow-[0_0_20px_rgba(0,168,132,0.3)]">
                <div className="h-full w-full rounded-full bg-[#111b21] flex items-center justify-center text-white font-bold text-[15px]">{user?.full_name?.charAt(0)||'S'}</div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-[#00a884] rounded-full border-[2.5px] border-[#202c33] online-glow" />
            </div>
            <div>
              <div className="text-[#e9edef] text-[15px] font-semibold tracking-wide">Chats</div>
              <div className="text-[11px] text-[#8696a0] flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#00a884]" /> Premium encrypted</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[{I:CircleDashed},{I:MessageCircle},{I:MessageSquarePlus},{I:MoreVertical}].map((x,i)=>(
              <button key={i} className="h-9 w-9 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#aebac1] hover:text-white transition-all hover:scale-105 active:scale-95">
                <x.I className="h-[20px] w-[20px]" />
              </button>
            ))}
          </div>
        </div>

        {/* Premium Search + Filters */}
        <div className="p-4 bg-[#111b21]/50 backdrop-blur-sm border-b border-white/[0.04] space-y-3.5">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-[#8696a0] group-focus-within:text-[#00a884] transition-colors" />
            <input
              placeholder="Cari atau mulai chat baru"
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              className="w-full h-10 pl-11 pr-4 bg-[rgba(42,57,66,0.8)] backdrop-blur rounded-xl text-[14px] text-[#d1d7db] placeholder:text-[#667781] focus:outline-none focus:bg-[#2a3942] focus:ring-2 focus:ring-[#00a884]/20 border border-white/[0.04] focus:border-[#00a884]/30 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex text-[10px] text-[#667781] bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">⌘K</div>
          </div>

          <div className="flex gap-2">
            {[
              {id:'all',label:'Semua',count:chatUsers.length},
              {id:'unread',label:'Belum dibaca',count:chatUsers.filter(u=>u.unread_count).length},
              {id:'group',label:'Grup',count:0}
            ].map(t=>(
              <button 
                key={t.id}
                onClick={()=>setFilterTab(t.id as any)}
                className={`relative px-3.5 py-2 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5
                  ${filterTab===t.id 
                    ? 'bg-gradient-to-r from-[#00a884] to-[#06cf9c] text-[#0a332c] shadow-[0_4px_12px_rgba(0,168,132,0.3)] scale-[1.02]' 
                    : 'bg-white/[0.06] hover:bg-white/[0.09] text-[#8696a0] hover:text-[#d1d7db] border border-white/[0.06] backdrop-blur'}`}
              >
                {t.label}
                {t.count>0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterTab===t.id ? 'bg-[#0a332c]/15' : 'bg-[#00a884]/15 text-[#00a884]'}`}>{t.count}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#667781]">
            <div className="flex items-center gap-1.5"><Archive className="h-3.5 w-3.5" /> Diarsipkan • {chatUsers.filter(u=>u.is_online).length} online</div>
            <div className="flex items-center gap-1 text-[#00a884]"><div className="h-2 w-2 rounded-full bg-[#00a884] animate-pulse" /> Live sync</div>
          </div>
        </div>

        {/* Chat List Premium */}
        <div className="flex-1 overflow-y-auto premium-scroll p-2 space-y-1">
          <AnimatePresence>
            {filtered.map((u,i)=> {
              const active = selectedChat===u.id;
              return (
                <motion.button
                  key={u.id}
                  initial={{opacity:0,y:8}}
                  animate={{opacity:1,y:0}}
                  transition={{delay:i*0.02}}
                  onClick={()=>setSelectedChat(u.id)}
                  className={`group w-full flex items-center gap-3 p-3 rounded-[14px] text-left relative overflow-hidden transition-all duration-200
                    ${active 
                      ? 'bg-[linear-gradient(135deg,rgba(0,168,132,0.18),rgba(6,207,156,0.12))] border border-[#00a884]/25 shadow-[0_8px_24px_rgba(0,168,132,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md' 
                      : 'hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]'}`}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-gradient-to-b from-[#00a884] to-[#06cf9c] rounded-full shadow-[0_0_12px_rgba(0,168,132,0.6)]" />}

                  <div className="relative flex-shrink-0">
                    {/* story ring if online */}
                    <div className={`h-[54px] w-[54px] rounded-full p-[2.5px] ${u.is_online ? 'bg-gradient-to-br from-[#00a884] to-[#06cf9c] shadow-[0_0_20px_rgba(0,168,132,0.25)]' : 'bg-white/10'}`}>
                      <div className="h-full w-full rounded-full bg-[#111b21] p-[2px]">
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-[#3b4a54] to-[#2a3942] flex items-center justify-center text-white font-semibold text-[18px]">{u.full_name.charAt(0).toUpperCase()}</div>
                      </div>
                    </div>
                    {u.is_online ? (
                      <div className="absolute bottom-0.5 right-0.5 h-[14px] w-[14px] rounded-full bg-[#00a884] border-[3px] border-[#111b21] online-glow flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[#00a884] online-pulse" />
                      </div>
                    ) : null}
                    {active && u.is_online && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#00a884] border-2 border-[#111b21] flex items-center justify-center shadow-[0_2px_8px_rgba(0,168,132,0.5)]">
                        <Pin className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className={`truncate text-[16px] leading-tight tracking-[0.1px] ${active ? 'font-semibold text-white' : 'font-normal text-[#e9edef] group-hover:text-white'}`}>{u.full_name}</div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {u.last_message_time && (
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${u.unread_count ? 'bg-[#00a884] text-[#042016] shadow-[0_2px_8px_rgba(0,168,132,0.3)]' : 'text-[#667781] bg-white/[0.06] group-hover:bg-white/[0.1]'}`}>
                            {formatListTime(u.last_message_time)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1.5 gap-2">
                      <span className="text-[13px] leading-[18px] truncate flex items-center gap-1.5 min-w-0">
                        {u.unread_count ? <span className="h-1.5 w-1.5 bg-[#00a884] rounded-full animate-pulse flex-shrink-0" /> : <CheckCheck className="h-3.5 w-3.5 text-[#667781] flex-shrink-0" />}
                        <span className={`truncate ${u.unread_count ? 'text-[#d1d7db] font-medium' : 'text-[#8696a0] group-hover:text-[#aebac1]'}`}>{u.last_message || <i className="text-[#667781]">Belum ada pesan • ketuk untuk mulai</i>}</span>
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {u.is_online && !u.unread_count && <div className="h-1.5 w-1.5 bg-[#00a884] rounded-full" />}
                        {u.unread_count ? (
                          <div className="bg-gradient-to-r from-[#00a884] to-[#06cf9c] text-[#042016] text-[11px] font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1.5 shadow-[0_4px_12px_rgba(0,168,132,0.35)] tracking-wide">{u.unread_count>9?'9+':u.unread_count}</div>
                        ) : <Star className="h-3 w-3 text-white/10 group-hover:text-white/20" />}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {filtered.length===0 && (
            <div className="p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4"><Search className="h-8 w-8 text-[#667781]" /></div>
              <p className="text-[#8696a0] text-sm">Tidak ada chat ditemukan</p>
              <p className="text-[#667781] text-xs mt-1">Coba kata kunci lain</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/[0.04] bg-[#111b21]/80 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] text-[#667781]">
            <div className="h-6 w-6 rounded-full bg-[#202c33] flex items-center justify-center"><Users className="h-3.5 w-3.5" /></div>
            <span>{chatUsers.length} kontak • {chatUsers.filter(u=>u.is_online).length} online</span>
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-[#00a884]/10 rounded-full border border-[#00a884]/15 text-[#00a884] font-medium">● Premium</div>
          </div>
        </div>
      </div>

      {/* CHAT AREA PREMIUM */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-10 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat && selectedUser ? (
          <>
            {/* Premium Header */}
            <div className="h-[64px] bg-[rgba(32,44,51,0.85)] backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-5 flex-shrink-0 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_4px_24px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-[#aebac1]" onClick={()=>setSelectedChat(null)}><ArrowLeft className="h-5 w-5" /></button>
                <div className="relative">
                  <div className={`h-10 w-10 rounded-full p-[2px] ${selectedUser.is_online ? 'bg-gradient-to-br from-[#00a884] to-[#06cf9c] shadow-[0_0_20px_rgba(0,168,132,0.35)]' : 'bg-white/10'}`}>
                    <div className="h-full w-full rounded-full bg-[#202c33] flex items-center justify-center text-white font-semibold">{selectedUser.full_name.charAt(0).toUpperCase()}</div>
                  </div>
                  {selectedUser.is_online && <div className="absolute bottom-0 right-0 h-3 w-3 bg-[#00a884] rounded-full border-2 border-[#202c33] online-glow"><div className="absolute inset-0 rounded-full bg-[#00a884] online-pulse" /></div>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[16px] text-[#e9edef] truncate tracking-wide">{selectedUser.full_name}</span>
                    {selectedUser.is_online && <span className="px-2 py-0.5 rounded-full bg-[#00a884]/15 border border-[#00a884]/20 text-[#00a884] text-[10px] font-bold tracking-wide flex items-center gap-1"><span className="h-1.5 w-1.5 bg-[#00a884] rounded-full animate-pulse" />ONLINE</span>}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`h-1 w-1 rounded-full ${lastSeenInfo?.online ? 'bg-[#00a884]' : 'bg-[#667781]'} flex-shrink-0`} />
                    <span className={`text-[12.5px] truncate ${lastSeenInfo?.online ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>{lastSeenInfo?.text}</span>
                    {!lastSeenInfo?.online && <span className="text-[10px] text-[#667781] hidden sm:inline">• terenkripsi</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[Video,Phone,Search,MoreVertical].map((Icon,i)=>(
                  <button key={i} className="h-9 w-9 rounded-full hover:bg-white/[0.08] active:bg-white/[0.12] flex items-center justify-center text-[#aebac1] hover:text-white transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-white/[0.06]">
                    <Icon className="h-[20px] w-[20px]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Premium */}
            <div className="flex-1 overflow-y-auto premium-scroll relative"
              style={{ backgroundColor:'#0b141a', backgroundImage:`radial-gradient(600px at 0% 0%, rgba(0,168,132,0.08), transparent 60%), radial-gradient(800px at 100% 100%, rgba(6,207,156,0.06), transparent 60%), url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundRepeat:'repeat', backgroundSize:'400px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#0b141a]/30 via-[#0b141a]/60 to-[#0b141a]/80 pointer-events-none" />
              <div className="relative z-10 px-4 md:px-[6%] py-6 space-y-1.5">
                <AnimatePresence>
                  {messages.map((msg, idx)=>{
                    const isOwn=msg.sender_id===user?.id;
                    const prev=messages[idx-1];
                    const showDate=!prev || formatListTime(prev.created_at)!==formatListTime(msg.created_at) || idx===0;
                    const isTodayMsg=isToday(new Date(msg.created_at));
                    const isYest=isYesterday(new Date(msg.created_at));
                    return (
                      <div key={msg.id} className="relative">
                        {showDate && (
                          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex justify-center my-6">
                            <div className="backdrop-blur-xl bg-[rgba(24,37,51,0.85)] border border-white/[0.08] text-[#8696a0] text-[11px] font-medium tracking-widest px-4 py-2 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-[#00a884] animate-pulse" />
                              {isTodayMsg?'HARI INI':isYest?'KEMARIN':format(new Date(msg.created_at),'d MMMM yyyy',{locale:id}).toUpperCase()}
                            </div>
                          </motion.div>
                        )}
                        <motion.div initial={{opacity:0,y:8,scale:0.98}} animate={{opacity:1,y:0,scale:1}} transition={{type:'spring',stiffness:500,damping:30}} className={`flex ${isOwn?'justify-end':'justify-start'} group`}>
                          <div className={`relative max-w-[72%] md:max-w-[58%] rounded-[12px] ${isOwn?'rounded-br-[4px] bubble-own' : 'rounded-bl-[4px] bubble-other'} border border-white/[0.06] overflow-hidden`}>
                            {/* shine top */}
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                            <div className="px-3.5 pt-2.5 pb-1.5">
                              <div className="text-[14.5px] leading-[20px] text-[#e9edef] whitespace-pre-wrap break-words font-[400] tracking-[0.1px] pr-16">{msg.content}</div>
                              <div className="flex items-center justify-end gap-1 mt-1.5 float-right ml-3 select-none">
                                <span className="text-[11px] text-[#8696a0]/90 font-medium tracking-wide">{format(new Date(msg.created_at),'HH:mm')}</span>
                                {isOwn && <span className="ml-1 flex items-center">{msg.is_read ? <CheckCheck className="h-[15px] w-[15px] text-[#53bdeb] drop-shadow-[0_0_6px_rgba(83,189,235,0.5)]" /> : <Check className="h-[15px] w-[15px] text-white/50" />}</span>}
                              </div>
                            </div>
                            {/* bottom highlight */}
                            <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${isOwn?'bg-gradient-to-r from-transparent to-[#06cf9c]/30':'bg-white/[0.04]'}`} />
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Premium Input */}
            <div className="bg-[rgba(32,44,51,0.9)] backdrop-blur-2xl border-t border-white/[0.06] p-3 flex items-end gap-2.5 flex-shrink-0 shadow-[0_-1px_0_rgba(255,255,255,0.06)_inset]">
              <div className="flex items-center gap-1 pb-1">
                <button className="h-10 w-10 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#8696a0] hover:text-[#d1d7db] transition-all hover:scale-105 active:scale-95"><Smile className="h-[24px] w-[24px]" /></button>
                <button className="h-10 w-10 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#8696a0] hover:text-[#d1d7db] transition-all hover:scale-105 active:scale-95"><Paperclip className="h-[22px] w-[22px] rotate-[-45deg]" /></button>
              </div>
              <div className="flex-1 relative group">
                <input
                  ref={inputRef}
                  placeholder="Ketik pesan premium..."
                  value={newMessage}
                  onChange={e=>setNewMessage(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); }}}
                  disabled={sending}
                  className="w-full bg-[rgba(42,57,66,0.85)] backdrop-blur-xl border border-white/[0.06] group-focus-within:border-[#00a884]/30 group-focus-within:ring-[3px] group-focus-within:ring-[#00a884]/15 rounded-[12px] px-4 py-3.5 text-[15px] text-[#e9edef] placeholder:text-[#667781] focus:outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.04)_inset] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <div className="h-5 px-2 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-[#8696a0] flex items-center">↵</div>
                </div>
              </div>
              <button onClick={sendMessage} disabled={!newMessage.trim()||sending} className="h-[48px] w-[48px] rounded-full bg-gradient-to-br from-[#00a884] to-[#06cf9c] hover:from-[#06cf9c] hover:to-[#00a884] shadow-[0_8px_20px_rgba(0,168,132,0.35),0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_28px_rgba(0,168,132,0.45)] flex items-center justify-center text-white transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex-shrink-0">
                {newMessage.trim() ? <Send className="h-5 w-5 ml-[2px] drop-shadow" /> : <Mic className="h-5 w-5 drop-shadow" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#0f1d1a] relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-[#00a884]/15 to-[#06cf9c]/10 blur-[100px]" />
              <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:`url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`}} />
            </div>
            <div className="text-center max-w-[480px] px-8 relative z-10">
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:200}} className="relative mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00a884] to-[#06cf9c] rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative h-[180px] w-[180px] mx-auto rounded-[28px] bg-gradient-to-br from-[#202c33] to-[#111b21] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center backdrop-blur-xl">
                  <MessageCircle className="h-16 w-16 text-[#2a3942]" />
                  <div className="absolute top-4 right-4 h-3 w-3 bg-[#00a884] rounded-full shadow-[0_0_12px_rgba(0,168,132,0.8)] animate-pulse" />
                </div>
              </motion.div>
              <h1 className="text-[28px] font-light tracking-tight text-white mb-3">WhatsApp Premium</h1>
              <p className="text-[14px] leading-6 text-[#8696a0]">Pengalaman chat kelas dunia dengan enkripsi, animasi halus, dan desain glassmorphism. Pilih kontak untuk memulai obrolan terenkripsi.</p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  {k:'End-to-end',v:'Encrypted'},
                  {k:'Online',v:`${chatUsers.filter(u=>u.is_online).length} teman`},
                  {k:'Sync',v:'Realtime'}
                ].map(i=>(
                  <div key={i.k} className="rounded-xl bg-white/[0.04] backdrop-blur border border-white/[0.06] p-3 text-left hover:bg-white/[0.06] transition-colors">
                    <div className="text-[11px] text-[#667781] uppercase tracking-widest">{i.k}</div>
                    <div className="text-[13px] text-[#d1d7db] font-medium mt-1">{i.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#182533] border border-white/[0.06] shadow-lg backdrop-blur">
                <div className="flex -space-x-2">
                  {chatUsers.filter(u=>u.is_online).slice(0,4).map(u=><div key={u.id} className="h-6 w-6 rounded-full bg-gradient-to-br from-[#00a884] to-[#06cf9c] border-2 border-[#182533] flex items-center justify-center text-[10px] text-white font-bold">{u.full_name[0]}</div>)}
                </div>
                <span className="text-xs text-[#8696a0]"><span className="text-[#00a884] font-semibold">{chatUsers.filter(u=>u.is_online).length} online</span> • premium presence</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
