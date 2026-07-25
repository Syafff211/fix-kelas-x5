'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className} data-active-tab={activeTab}>
      {Array.isArray(children)
        ? children.map((child) => {
            if (child.type === TabsList) {
              return <child.type key="list" {...child.props} activeTab={activeTab} setActiveTab={setActiveTab} />;
            }
            if (child.type === TabsContent) {
              return <child.type key={child.props.value} {...child.props} isActive={child.props.value === activeTab} />;
            }
            return child;
          })
        : children}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsList({ children, className, activeTab, setActiveTab }: TabsListProps) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)}>
      {Array.isArray(children)
        ? children.map((child) => (
            <child.type
              key={child.props.value}
              {...child.props}
              isActive={child.props.value === activeTab}
              onClick={() => setActiveTab?.(child.props.value)}
            />
          ))
        : children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function TabsTrigger({ value, children, className, isActive, onClick }: TabsTriggerProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-background text-foreground shadow-sm',
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}

export function TabsContent({ value, children, className, isActive }: TabsContentProps) {
  if (!isActive) return null;
  
  return (
    <div
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
}
