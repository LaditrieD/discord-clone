import React from 'react';
import { User } from '../types/chat';

interface AvatarProps {
  user?: Partial<User> | null;
  sizeClass?: string;
  onClick?: () => void;
}

export default function Avatar({ user, sizeClass = "w-8 h-8 text-xs", onClick }: AvatarProps) {
  if (!user) {
    return (
      <div className={`${sizeClass} rounded-full bg-indigo-950 flex items-center justify-center font-bold text-white border border-white/10 uppercase`}>
        ?
      </div>
    );
  }

  if (user.avatar) {
    return (
      <img 
        src={user.avatar} 
        alt={user.username || 'avatar'} 
        onClick={onClick}
        className={`${sizeClass} rounded-full object-cover border border-white/5 cursor-pointer`} 
      />
    );
  }

  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : '?';
  
  // Stable background color selection based on username hash
  const colors = [
    'bg-gradient-to-br from-indigo-600 to-indigo-800', 
    'bg-gradient-to-br from-emerald-600 to-emerald-800', 
    'bg-gradient-to-br from-rose-600 to-rose-800', 
    'bg-gradient-to-br from-amber-600 to-amber-800', 
    'bg-gradient-to-br from-sky-600 to-sky-800', 
    'bg-gradient-to-br from-violet-600 to-violet-800', 
    'bg-gradient-to-br from-cyan-600 to-cyan-800', 
    'bg-gradient-to-br from-teal-600 to-teal-800'
  ];
  const hash = user.username ? user.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const colorClass = colors[hash % colors.length];

  return (
    <div 
      onClick={onClick}
      className={`${sizeClass} rounded-full ${colorClass} flex items-center justify-center font-bold text-white border border-white/10 uppercase select-none cursor-pointer tracking-wider`}
    >
      {initials}
    </div>
  );
}
