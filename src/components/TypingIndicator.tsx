'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store';

const supabase = createClient();

interface TypingIndicatorProps {
  channelName: string;
  className?: string;
}

export function TypingIndicator({ channelName, className = '' }: TypingIndicatorProps) {
  const { user } = useAuthStore();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  let typingTimeout: NodeJS.Timeout;

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`typing:${channelName}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers(prev => {
            if (payload.is_typing) {
              return [...new Set([...prev, payload.full_name])];
            } else {
              return prev.filter(name => name !== payload.full_name);
            }
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, user]);

  const handleTyping = async () => {
    if (!user) return;

    if (!isTyping) {
      setIsTyping(true);
      await supabase.channel(`typing:${channelName}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          full_name: user.full_name,
          is_typing: true,
        },
      });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(async () => {
      setIsTyping(false);
      await supabase.channel(`typing:${channelName}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          full_name: user.full_name,
          is_typing: false,
        },
      });
    }, 2000);
  };

  return {
    typingUsers,
    handleTyping,
    TypingDisplay: () => (
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-xs text-muted-foreground ${className}`}
          >
            <span className="italic">
              {typingUsers.length === 1
                ? `${typingUsers[0]} sedang mengetik`
                : typingUsers.length === 2
                ? `${typingUsers[0]} dan ${typingUsers[1]} sedang mengetik`
                : `${typingUsers[0]} dan ${typingUsers.length - 1} lainnya sedang mengetik`}
            </span>
            <span className="inline-flex ml-1">
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              >
                .
              </motion.span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    ),
  };
}
