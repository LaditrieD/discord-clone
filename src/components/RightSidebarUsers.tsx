import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  Shield, ShieldAlert, ShieldCheck, UserCheck, MessageSquare, 
  MoreVertical, Ban, Trash2, Clock, VolumeX, Plus, UserPlus, Eye 
} from 'lucide-react';
import { User, RoleType } from '../types/chat';
import Avatar from './Avatar';

const PRESET_COLORS = [
  { hex: '#ef4444', textClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20' },
  { hex: '#f59e0b', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20' },
  { hex: '#10b981', textClass: 'text-green-400', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20' },
  { hex: '#3b82f6', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20' },
  { hex: '#6366f1', textClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20' },
  { hex: '#8b5cf6', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20' },
  { hex: '#f43f5e', textClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20' },
  { hex: '#14b8a6', textClass: 'text-teal-400', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20' },
];

export default function RightSidebarUsers() {
  const { 
    servers, 
    activeServerId, 
    allUsers, 
    currentUser, 
    userServerRoles, 
    setUserServerRole,
    addFriend, 
    removeFriend, 
    toggleBlockUser,
    friends, 
    blocked,
    banUser, 
    kickUser, 
    timeoutUser, 
    timeoutUsers, 
    removeTimeout,
    settings 
  } = useChatStore();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModerationMenuId, setShowModerationMenuId] = useState<string | null>(null);

  // Translation helper
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  const currentServer = servers.find((s) => s.id === activeServerId);
  if (activeServerId === 'dm' || !currentServer) return null;

  const myRole = userServerRoles[currentUser.id]?.[activeServerId] || 'member';
  const hasAdminPrivileges = myRole === 'owner' || myRole === 'admin';

  // Role badges definitions
  const roleStyles: Record<string, { label: string, color: string, icon: any }> = {
    owner: { label: t('Kurucu', 'Owner'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: ShieldAlert },
    admin: { label: t('Yönetici', 'Admin'), color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: ShieldCheck },
    moderator: { label: t('Moderatör', 'Mod'), color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Shield },
    member: { label: t('Üye', 'Member'), color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: UserCheck }
  };

  const getRoleDisplay = (roleId: string) => {
    if (roleStyles[roleId]) return roleStyles[roleId];
    
    // Find in custom roles
    const custom = currentServer.roles?.find(r => r.id === roleId);
    if (custom) {
      const preset = PRESET_COLORS.find(p => p.hex.toLowerCase() === custom.color.toLowerCase());
      return {
        label: custom.name,
        color: preset ? `${preset.textClass} ${preset.bgClass} ${preset.borderClass}` : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        icon: Shield
      };
    }
    
    return {
      label: roleId.toUpperCase(),
      color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
      icon: UserCheck
    };
  };

  // Get active roles mapping for the current server
  const getMemberRole = (userId: string): string => {
    // If user is server owner, override to owner
    if (userId === currentServer.ownerId) return 'owner';
    return userServerRoles[userId]?.[activeServerId] || 'member';
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
    setShowModerationMenuId(null);
  };

  const toggleModerationMenu = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setShowModerationMenuId(showModerationMenuId === userId ? null : userId);
  };

  // Group members by their server roles
  const categorizedMembers = allUsers.filter(u => u.id !== 'bot-gemini').reduce((acc, user) => {
    const role = getMemberRole(user.id);
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  const botUsers = allUsers.filter(u => u.id === 'bot-gemini');

  // Dynamic roles rendering hierarchy order
  const rolesToRender = [
    'owner',
    'admin',
    'moderator',
    ...(currentServer.roles || []).map(r => r.id),
    'member'
  ];

  return (
    <div id="right-sidebar-users" className="w-60 bg-white/[0.01] backdrop-blur-xl border-l border-white/5 flex flex-col shrink-0 select-none overflow-y-auto no-scrollbar relative text-white">
      
      {/* Bot list section */}
      <div className="p-4 border-b border-white/5">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 mb-2.5">
          {t('Yapay Zeka Botları', 'AI Bots')} ({botUsers.length})
        </h4>
        <div className="space-y-1">
          {botUsers.map((bot) => (
            <button
              key={bot.id}
              onClick={() => handleUserClick(bot)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition text-left"
            >
              <div className="relative">
                <img src={bot.avatar} alt="bot" className="w-8 h-8 rounded-full object-cover border border-indigo-500/40" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-black" />
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  {bot.username}
                  <span className="text-[9px] bg-indigo-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase scale-90">Bot</span>
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{bot.customStatus}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Group listing by Roles */}
      <div className="p-4 space-y-5 flex-1">
        {rolesToRender.map((roleKey) => {
          const list = categorizedMembers[roleKey] || [];
          if (list.length === 0) return null;

          const roleInfo = getRoleDisplay(roleKey);
          const RoleIconComponent = roleInfo.icon;

          return (
            <div key={roleKey} className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 flex items-center gap-1.5">
                <RoleIconComponent size={10} className={roleInfo.color.split(' ')[0]} />
                {roleInfo.label} — {list.length}
              </h4>

              <div className="space-y-0.5">
                {list.map((user) => {
                  const isMe = user.id === currentUser.id;
                  const isOnline = user.status === 'online' || user.status === 'idle' || user.status === 'dnd';
                  const userTimeoutUntil = timeoutUsers[activeServerId]?.[user.id] || 0;
                  const isTimedOut = userTimeoutUntil > Date.now();

                  return (
                    <div 
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition text-left cursor-pointer group/item ${
                        selectedUser?.id === user.id ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1">
                        <div className="relative shrink-0">
                          <Avatar user={user} sizeClass="w-8 h-8" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                            user.status === 'online' ? 'bg-green-500' : user.status === 'idle' ? 'bg-amber-500' : user.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                        </div>
                        <div className="truncate">
                          <div className={`text-xs font-semibold ${isMe ? 'text-white' : 'text-gray-300 group-hover/item:text-white'}`}>
                            {user.username}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                            {isTimedOut && <VolumeX size={10} className="text-red-400 shrink-0" />}
                            <span className="truncate">{isTimedOut ? t('Susturuldu', 'Timed Out') : user.customStatus || `@${user.username}`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Moderation quick actions launcher button (Admin only, can't moderate yourself) */}
                      {hasAdminPrivileges && !isMe && user.id !== currentServer.ownerId && (
                        <button
                          id={`user-mod-toggle-${user.id}`}
                          onClick={(e) => toggleModerationMenu(e, user.id)}
                          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition opacity-0 group-hover/item:opacity-100 relative shrink-0"
                        >
                          <MoreVertical size={14} />

                          {/* Float Moderation Action Popover */}
                          {showModerationMenuId === user.id && (
                            <div className="absolute right-6 top-0 w-44 bg-[#090d16] border border-white/10 p-1.5 rounded-xl shadow-2xl z-50 text-xs text-gray-300 flex flex-col gap-1">
                              <div className="px-2 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                                {t('Yönetici Araçları', 'Moderation Panel')}
                              </div>
                              
                              {/* Timeout Toggle */}
                              {isTimedOut ? (
                                <button
                                  id={`mod-unmute-${user.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTimeout(activeServerId, user.id);
                                    setShowModerationMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 hover:bg-green-500/10 hover:text-green-400 rounded transition font-medium flex items-center gap-2"
                                >
                                  <Clock size={12} />
                                  {t('Susturmayı Kaldır', 'Unmute')}
                                </button>
                              ) : (
                                <button
                                  id={`mod-mute-${user.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    timeoutUser(activeServerId, user.id, 5, currentUser.username);
                                    setShowModerationMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 hover:bg-amber-500/10 hover:text-amber-400 rounded transition font-medium flex items-center gap-2"
                                >
                                  <Clock size={12} />
                                  {t('5 Dk Sustur', 'Mute 5 Mins')}
                                </button>
                              )}

                              {/* Kick button */}
                              <button
                                id={`mod-kick-${user.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(t(`${user.username} adlı üyeyi sunucudan atmak istiyor musunuz?`, `Are you sure you want to kick ${user.username}?`))) {
                                    kickUser(activeServerId, user.id, currentUser.username);
                                  }
                                  setShowModerationMenuId(null);
                                }}
                                className="w-full text-left px-2 py-1.5 hover:bg-orange-500/10 hover:text-orange-400 rounded transition font-medium flex items-center gap-2"
                              >
                                <Trash2 size={12} />
                                {t('Sunucudan At (Kick)', 'Kick Member')}
                              </button>

                              {/* Ban button */}
                              <button
                                id={`mod-ban-${user.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(t(`${user.username} adlı üyeyi sunucudan kalıcı olarak yasaklamak istiyor musunuz?`, `Are you sure you want to ban ${user.username}?`))) {
                                    banUser(activeServerId, user.id, currentUser.username);
                                  }
                                  setShowModerationMenuId(null);
                                }}
                                className="w-full text-left px-2 py-1.5 hover:bg-red-600/20 hover:text-red-400 rounded transition font-bold flex items-center gap-2 border-t border-white/5 mt-1"
                              >
                                <Ban size={12} />
                                {t('Yasakla (Ban)', 'Ban Member')}
                              </button>

                              <div className="border-t border-white/5 my-1" />

                              {/* Promote / Demote Role Actions */}
                              {myRole === 'owner' && (
                                <>
                                  <button
                                    id={`role-promote-admin-${user.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUserServerRole(user.id, activeServerId, 'admin');
                                      setShowModerationMenuId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5 rounded transition text-[10px]"
                                  >
                                    {t('Yönetici Yap', 'Make Admin')}
                                  </button>
                                  <button
                                    id={`role-promote-mod-${user.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUserServerRole(user.id, activeServerId, 'moderator');
                                      setShowModerationMenuId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5 rounded transition text-[10px]"
                                  >
                                    {t('Moderatör Yap', 'Make Moderator')}
                                  </button>
                                  <button
                                    id={`role-demote-member-${user.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUserServerRole(user.id, activeServerId, 'member');
                                      setShowModerationMenuId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5 rounded transition text-[10px] text-gray-500"
                                  >
                                    {t('Rolu Kaldır (Üye)', 'Demote to Member')}
                                  </button>
                                </>
                              )}

                            </div>
                          )}
                        </button>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected member floating custom detailed profile card */}
      {selectedUser && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-40 animate-scale-up text-xs">
          
          {/* Banner */}
          <div className="h-16 w-full relative" style={{ background: selectedUser.banner.includes('gradient') ? selectedUser.banner : `url(${selectedUser.banner}) center/cover` }}>
            <button 
              id="selected-user-card-close"
              onClick={() => setSelectedUser(null)}
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full text-gray-300 hover:text-white transition"
            >
              <Trash2 size={10} className="rotate-45" />
            </button>
          </div>

          {/* Profile details */}
          <div className="p-4 relative">
            
            {/* Float Avatar offset */}
            <div className="absolute -top-10 left-4">
              <Avatar user={selectedUser} sizeClass="w-14 h-14 text-lg border-4 border-slate-950 bg-slate-950" />
            </div>

            <div className="pt-5 space-y-3.5">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {selectedUser.username}
                  <span className="text-gray-400 font-normal">#{selectedUser.tag}</span>
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5 italic">{selectedUser.customStatus || t('Çevrimiçi', 'Away from desk')}</p>
              </div>

              {/* Action buttons (Add friend, block, etc.) */}
              {selectedUser.id !== currentUser.id && selectedUser.id !== 'bot-gemini' && (
                <div className="grid grid-cols-2 gap-2">
                  {friends.includes(selectedUser.id) ? (
                    <button
                      id={`card-remove-friend-${selectedUser.id}`}
                      onClick={() => removeFriend(selectedUser.id)}
                      className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg font-semibold transition text-center"
                    >
                      {t('Arkadaşlıktan Çıkar', 'Unfriend')}
                    </button>
                  ) : (
                    <button
                      id={`card-add-friend-${selectedUser.id}`}
                      onClick={() => addFriend(selectedUser.id)}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition text-center"
                    >
                      {t('Arkadaş Ekle', 'Add Friend')}
                    </button>
                  )}

                  <button
                    id={`card-block-${selectedUser.id}`}
                    onClick={() => toggleBlockUser(selectedUser.id)}
                    className={`py-1.5 px-3 rounded-lg font-semibold transition text-center ${
                      blocked.includes(selectedUser.id) 
                        ? 'bg-green-600/20 text-green-300 hover:bg-green-600 hover:text-white' 
                        : 'bg-black/50 hover:bg-red-600/20 hover:text-red-300 text-gray-400'
                    }`}
                  >
                    {blocked.includes(selectedUser.id) ? t('Engeli Kaldır', 'Unblock') : t('Engelle', 'Block')}
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
