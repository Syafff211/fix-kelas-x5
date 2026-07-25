'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Search, Users, Check, CheckCheck, ArrowLeft, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
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
  sender?: {
    full_name: string;
    avatar_url?: string;
    role?: string;
  };
}

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  is_online?: boolean;
  last_seen?: string;
}

export default function AdminMessagesPage() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all users (students and admins)
  useEffect(() => {
    if (!user) return;

    const fetchChatUsers = async () => {
      try {
        // Get all users (students and admins)
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('full_name');

        if (usersError) throw usersError;

        // Get last messages and unread counts for each user
        const usersWithMessages = await Promise.all(
          (users || []).map(async (chatUser) => {
            // Get last message
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('*')
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${user.id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('sender_id', chatUser.id)
              .eq('receiver_id', user.id)
              .eq('is_read', false);

            return {
              id: chatUser.id,
              full_name: chatUser.full_name,
              avatar_url: chatUser.avatar_url,
              role: chatUser.role,
              last_message: lastMsg?.content || '',
              last_message_time: lastMsg?.created_at,
              unread_count: unreadCount || 0,
              is_online: false,
              last_seen: chatUser.updated_at,
            };
          })
        );

        // Sort by last message time
        usersWithMessages.sort((a, b) => {
          if (!a.last_message_time) return 1;
          if (!b.last_message_time) return -1;
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });

        setChatUsers(usersWithMessages);
      } catch (error) {
        console.error('Error fetching chat users:', error);
        toast.error('Gagal memuat daftar chat');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchChatUsers();
  }, [user?.id]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (!selectedChat || !user) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(full_name, avatar_url, role)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          setMessages(data);
          scrollToBottom();
          
          // Mark messages as read
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', selectedChat)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Gagal memuat pesan');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat_${user.id}_${selectedChat}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedChat) ||
            (newMsg.sender_id === selectedChat && newMsg.receiver_id === user.id)
          ) {
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, { ...newMsg, sender: { full_name: user.full_name || 'Admin', role: 'admin' } }];
            });
            scrollToBottom();
            
            // Mark as read if received message
            if (newMsg.sender_id === selectedChat) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: user.id,
        receiver_id: selectedChat,
        content: messageContent,
        is_read: false,
      }]);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Gagal mengirim pesan: ' + error.message);
        setNewMessage(messageContent);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, 'HH:mm');
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else if (diffDays < 7) {
      return format(date, 'EEEE', { locale: id });
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const getLastSeenText = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Terakhir dilihat baru-baru ini';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes}m lalu`;
    
    return formatDistanceToNow(date, { addSuffix: true, locale: id });
  };

  const filteredUsers = chatUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = chatUsers.find(u => u.id === selectedChat);

  const handleBackToList = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Memuat pesan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 md:gap-4 overflow-hidden">
      {/* Chat List */}
      <Card className={`w-full md:w-96 flex flex-col flex-shrink-0 ${selectedChat ? 'hidden md:flex' : 'flex'} rounded-none md:rounded-lg border-0 md:border border-white/10`}>
        <div className="p-3 md:p-4 border-b border-white/10">
          <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Admin Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari user..."
              className="pl-10 h-10 md:h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Tidak ada user ditemukan</p>
            </div>
          ) : (
            filteredUsers.map((chatUser) => (
              <button
                key={chatUser.id}
                onClick={() => setSelectedChat(chatUser.id)}
                className={`w-full p-3 md:p-4 flex items-center gap-3 hover:bg-white/5 active:bg-white/10 transition-all ${
                  selectedChat === chatUser.id ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg ${
                    chatUser.role === 'admin' 
                      ? 'bg-gradient-to-br from-red-500/30 to-purple-500/30 text-red-500' 
                      : 'bg-gradient-to-br from-primary/30 to-purple-500/30 text-primary'
                  }`}>
                    {chatUser.full_name.charAt(0)}
                  </div>
                  {chatUser.is_online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <div className="font-semibold text-sm md:text-base truncate flex items-center gap-1">
                      {chatUser.full_name}
                      {chatUser.role === 'admin' && (
                        <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3">
                          Admin
                        </Badge>
                      )}
                    </div>
                    {chatUser.last_message_time && (
                      <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatMessageTime(chatUser.last_message_time)}
                      </div>
                    )}
                  </div>
                  {chatUser.last_message ? (
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {chatUser.last_message}
                    </div>
                  ) : (
                    <div className="text-xs md:text-sm text-muted-foreground italic">
                      Belum ada pesan
                    </div>
                  )}
                </div>
                {chatUser.unread_count && chatUser.unread_count > 0 && (
                  <Badge variant="primary" className="h-5 md:h-6 min-w-[20px] md:min-w-[24px] flex items-center justify-center px-1.5 md:px-2 text-[10px] md:text-xs font-bold flex-shrink-0">
                    {chatUser.unread_count}
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Chat Window */}
      <Card className={`flex-1 flex flex-col min-w-0 ${selectedChat ? 'flex' : 'hidden md:flex'} rounded-none md:rounded-lg border-0 md:border border-white/10`}>
        {selectedChat && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-white/10 flex items-center gap-2 md:gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 flex-shrink-0"
                onClick={handleBackToList}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="relative flex-shrink-0">
                <div className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
                  selectedUser.role === 'admin' 
                    ? 'bg-gradient-to-br from-red-500/30 to-purple-500/30 text-red-500' 
                    : 'bg-gradient-to-br from-primary/30 to-purple-500/30 text-primary'
                }`}>
                  {selectedUser.full_name.charAt(0)}
                </div>
                {selectedUser.is_online && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3 md:w-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm md:text-base truncate flex items-center gap-2">
                  {selectedUser.full_name}
                  {selectedUser.role === 'admin' && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                  {getLastSeenText(selectedUser.last_seen, selectedUser.is_online)}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-gradient-to-b from-background/50 to-background">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="spinner mb-2" />
                    <p className="text-xs text-muted-foreground">Memuat pesan...</p>
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.id;
                      const showDate = index === 0 || 
                        formatMessageTime(messages[index - 1].created_at) !== formatMessageTime(message.created_at);

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="flex items-center justify-center my-3 md:my-4">
                              <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] md:text-xs text-muted-foreground">
                                {formatMessageTime(message.created_at)}
                              </div>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-3 md:px-4 py-2 shadow-sm ${
                                isOwn
                                  ? 'bg-red-500 text-white rounded-br-sm'
                                  : 'bg-card border border-white/10 rounded-bl-sm'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                                <span className="text-[10px] md:text-xs">
                                  {format(new Date(message.created_at), 'HH:mm')}
                                </span>
                                {isOwn && (
                                  message.is_read ? (
                                    <CheckCheck className="h-3 w-3 md:h-4 md:w-4 text-blue-200" />
                                  ) : (
                                    <Check className="h-3 w-3 md:h-4 md:w-4" />
                                  )
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-2 md:p-4 border-t border-white/10 bg-card flex-shrink-0">
              <div className="flex gap-1.5 md:gap-2 items-center">
                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                  <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Input
                  ref={inputRef}
                  placeholder="Ketik pesan..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-9 md:h-10 text-sm md:text-base"
                  disabled={sending}
                />
                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                  <Smile className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sending}
                  className="h-9 w-9 md:h-10 md:w-10 p-0 flex-shrink-0 bg-red-500 hover:bg-red-600"
                >
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
            <div className="text-center">
              <Shield className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-3 md:mb-4 opacity-30 text-red-500" />
              <p className="text-base md:text-lg font-medium mb-1 md:mb-2">Admin Messages</p>
              <p className="text-xs md:text-sm">Chat dengan siswa dan admin lain</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
