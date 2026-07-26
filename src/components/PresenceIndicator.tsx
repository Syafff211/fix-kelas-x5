'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePresence } from '@/hooks/usePresence';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PresenceIndicatorProps {
  page?: string;
  showCount?: boolean;
  maxDisplay?: number;
}

export function PresenceIndicator({ 
  page, 
  showCount = true, 
  maxDisplay = 5 
}: PresenceIndicatorProps) {
  const { onlineUsers, isLoading, getOnlineCount, getUsersOnPage } = usePresence(page);

  const usersToShow = page ? getUsersOnPage(page) : onlineUsers;
  const displayUsers = usersToShow.slice(0, maxDisplay);
  const remainingCount = usersToShow.length - maxDisplay;
  const onlineCount = getOnlineCount();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (onlineCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 cursor-default">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              {showCount && (
                <span className="text-xs text-muted-foreground">Offline</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tidak ada user yang online</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          <AnimatePresence>
            {displayUsers.map((user, index) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={user.avatar_url} alt={user.full_name} />
                      <AvatarFallback className="text-xs">
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online Status Dot */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                        user.status === 'online'
                          ? 'bg-green-500'
                          : user.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">{user.full_name}</p>
                    <p className="text-muted-foreground capitalize">{user.status}</p>
                    {user.current_page && (
                      <p className="text-muted-foreground text-[10px]">
                        di {user.current_page}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>

          {/* Remaining Count Badge */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-semibold">+{remainingCount}</span>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dan {remainingCount} user lainnya</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Online Count Badge */}
        {showCount && (
          <Badge variant="secondary" className="gap-1">
            <Wifi className="h-3 w-3" />
            <span>{onlineCount} online</span>
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
