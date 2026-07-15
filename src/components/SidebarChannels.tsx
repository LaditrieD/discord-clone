import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  ChevronDown, Plus, Hash, Volume2, Mic, MicOff, Headphones, Settings, 
  Video, ScreenShare, X, Check, PhoneOff, Trash2, Shield, Radio, ShieldAlert, Search 
} from 'lucide-react';
import Avatar from './Avatar';

interface SidebarChannelsProps {
  onOpenSettings: () => void;
  onOpenServerSettings: () => void;
}

export default function SidebarChannels({ onOpenSettings, onOpenServerSettings }: SidebarChannelsProps) {
  const { 
    servers, 
    activeServerId, 
    activeChannelId, 
    setActiveChannelId, 
    deleteServer,
    addChannel, 
    deleteChannel,
    currentUser, 
    allUsers,
    userStatus, 
    setUserStatus, 
    voiceState, 
    joinVoiceChannel, 
    toggleMute, 
    toggleDeafen, 
    toggleCamera,
    userServerRoles,
    settings 
  } = useChatStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [searchQuery, setSearchQuery] = useState('');

  // Translation helper
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  // Active server context
  const currentServer = servers.find((s) => s.id === activeServerId);
  const myRole = userServerRoles[currentUser.id]?.[activeServerId] || 'member';
  const hasAdminPrivileges = myRole === 'owner' || myRole === 'admin';

  // Calculate member stats for active server
  const serverMembers = allUsers.filter(u => u.id !== 'bot-gemini');
  const totalMembers = serverMembers.length;
  const onlineCount = serverMembers.filter(u => u.status === 'online' || u.status === 'idle' || u.status === 'dnd').length;

  if (activeServerId === 'dm') {
    return (
      <div id="sidebar-channels-dm" className="w-60 bg-white/[0.01] backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Header */}
          <div className="h-14 border-b border-white/5 flex items-center px-4 font-bold text-sm tracking-wide font-display text-white">
            {t('Doğrudan Mesajlar', 'Direct Messages')}
          </div>
          {/* Static buttons list */}
          <div className="p-3.5 space-y-1.5">
            <button 
              onClick={() => setActiveChannelId('dm-friends')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeChannelId === 'dm-friends' ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Hash size={16} />
              {t('Arkadaşlar listesi', 'Friends Directory')}
            </button>
            <div className="pt-4 pb-2 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {t('Özel Mesajlar (Simüle)', 'Direct Messages (Simulated)')}
            </div>
            
            {/* Mock DMs */}
            {[
              { id: 'dm-zeynep', name: 'Zeynep_Dev', status: 'online', desc: 'React Geliştiricisi' },
              { id: 'dm-gezgin', name: 'KozmikGezgin', status: 'idle', desc: 'Server Sahibi' },
              { id: 'dm-gamer', name: 'Gamer35', status: 'dnd', desc: 'Gamer Arkadaş' },
            ].map((dm) => (
              <button
                key={dm.id}
                onClick={() => setActiveChannelId(dm.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                  activeChannelId === dm.id ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/10' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-indigo-900/30 text-[10px] flex items-center justify-center font-bold text-indigo-300">
                      {dm.name[0]}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${
                      dm.status === 'online' ? 'bg-green-500' : dm.status === 'idle' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">{dm.name}</div>
                    <div className="text-[10px] text-gray-400 font-normal truncate max-w-[120px]">{dm.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User bar */}
        {renderUserBar()}
      </div>
    );
  }

  if (!currentServer) return null;

  const handleCreateChannel = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsAddChannelOpen(true);
  };

  const submitCreateChannel = () => {
    if (newChannelName.trim()) {
      addChannel(activeServerId, selectedCategoryId, newChannelName, newChannelType);
      setNewChannelName('');
      setIsAddChannelOpen(false);
    }
  };

  const handleDeleteServer = () => {
    if (confirm(t('Bu sunucuyu kalıcı olarak silmek istediğinizden emin misiniz?', 'Are you sure you want to delete this server permanently?'))) {
      deleteServer(activeServerId);
      setIsDropdownOpen(false);
    }
  };

  function renderUserBar() {
    const statusColors = {
      online: 'bg-green-500',
      idle: 'bg-amber-500',
      dnd: 'bg-red-500',
      offline: 'bg-gray-500',
    };

    return (
      <div className="border-t border-white/5 bg-white/[0.01] backdrop-blur-md flex flex-col shrink-0">
        
        {/* Active connected voice channel card info */}
        {voiceState.currentChannelId && (
          <div className="p-3 bg-indigo-900/10 border-b border-indigo-500/20 flex flex-col gap-1.5 animate-pulse-slow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-green-400" />
                <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">
                  {t('Sesli Bağlantı', 'Voice Connected')}
                </span>
              </div>
              <button 
                id="voice-disconnect-btn"
                onClick={() => joinVoiceChannel(null)}
                className="p-1 hover:bg-red-600/30 text-gray-400 hover:text-red-400 rounded-full transition"
                title={t('Bağlantıyı Kes', 'Disconnect')}
              >
                <PhoneOff size={14} />
              </button>
            </div>
            <button 
              id="voice-card-view-btn"
              onClick={() => setActiveChannelId(voiceState.currentChannelId!)}
              className="text-left w-full hover:bg-white/5 p-1 rounded transition flex items-center justify-between group/vcard"
            >
              <div className="text-xs font-semibold text-white truncate">
                {t('Oda:', 'Room:')} {servers.flatMap(s => s.categories.flatMap(c => c.channels)).find(c => c.id === voiceState.currentChannelId)?.name || 'Lobi'}
              </div>
              <span className="text-[9px] text-indigo-400 group-hover/vcard:text-indigo-300 transition shrink-0 underline">
                {t('Ekranı Aç', 'Open Screen')}
              </span>
            </button>
            <div className="flex items-center gap-2 mt-0.5 px-1">
              <button 
                id="voice-bar-cam"
                onClick={toggleCamera} 
                className={`p-1 rounded text-[10px] flex items-center gap-1 transition ${
                  voiceState.isCameraOn ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Video size={10} /> Cam
              </button>
              <span className="text-[10px] text-gray-500">•</span>
              <span className="text-[10px] text-indigo-300 font-mono">24kbps Latency: 12ms</span>
            </div>
          </div>
        )}

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Status select popup / avatar */}
            <div className="relative group/status cursor-pointer">
              <Avatar user={currentUser} sizeClass="w-8 h-8" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${statusColors[userStatus]}`} />
              
              {/* Status Change Popover */}
              <div className="absolute bottom-10 left-0 hidden group-hover/status:flex flex-col bg-black/95 border border-white/10 p-2 rounded-xl w-36 shadow-2xl z-50 animate-fade-in gap-1">
                {[
                  { id: 'online', name: 'Çevrimiçi', color: 'bg-green-500' },
                  { id: 'idle', name: 'Boşta', color: 'bg-amber-500' },
                  { id: 'dnd', name: 'Rahatsız Etmeyin', color: 'bg-red-500' },
                  { id: 'offline', name: 'Görünmez', color: 'bg-gray-500' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setUserStatus(st.id as any)}
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded text-left text-xs font-medium text-gray-300 hover:text-white transition"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                    <span>{st.name}</span>
                    {userStatus === st.id && <Check size={12} className="ml-auto text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-left">
              <div className="text-xs font-semibold text-white max-w-[100px] truncate">{currentUser.username}</div>
              <div className="text-[10px] text-gray-400 font-normal">#{currentUser.tag}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              id="user-bar-mute"
              onClick={toggleMute} 
              className={`p-1.5 rounded-lg transition ${voiceState.isMuted ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title={voiceState.isMuted ? t('Sesi Aç', 'Unmute Mic') : t('Sustur', 'Mute Mic')}
            >
              {voiceState.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button 
              id="user-bar-deafen"
              onClick={toggleDeafen} 
              className={`p-1.5 rounded-lg transition relative ${voiceState.isDeafened ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title={voiceState.isDeafened ? t('Sağırlaştırmayı Kaldır', 'Undeafen Audio') : t('Sağırlaştır', 'Deafen Audio')}
            >
              <Headphones size={16} className={voiceState.isDeafened ? 'opacity-50' : ''} />
              {voiceState.isDeafened && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4 h-0.5 bg-red-500 rotate-45 transform origin-center rounded" />
                </div>
              )}
            </button>
            <button 
              id="user-bar-settings"
              onClick={onOpenSettings} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              title={t('Kullanıcı Ayarları', 'User Settings')}
            >
              <Settings size={16} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div id="sidebar-channels" className="w-60 bg-white/[0.01] backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0 select-none text-white">
      <div>
        {/* Server Header Dropdown */}
        <div className="relative">
          <button
            id="channels-server-header"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="h-16 border-b border-white/5 w-full flex flex-col justify-center px-4 hover:bg-white/5 transition duration-200"
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate font-bold text-sm tracking-wide font-display text-white">{currentServer.name}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>{onlineCount} {t('Çevrimiçi', 'Online')}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{totalMembers} {t('Üye', 'Members')}</span>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-15 left-2 right-2 bg-black/95 border border-white/10 p-2 rounded-xl shadow-2xl z-50 animate-fade-in flex flex-col gap-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1">
                {t('Sunucu Yönetimi', 'Server Administration')}
              </div>
              <div className="px-2.5 py-1 flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Shield size={12} />
                Rolünüz: {myRole.toUpperCase()}
              </div>
              
              <button
                id="server-action-copy"
                onClick={() => {
                  navigator.clipboard.writeText(currentServer.id);
                  alert(t('Sunucu Kimliği Kopyalandı!', 'Server ID Copied!'));
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded text-xs font-semibold text-gray-300 hover:text-white transition"
              >
                {t('Sunucu Kimliğini Kopyala', 'Copy Server ID')}
              </button>

              {hasAdminPrivileges && (
                <button
                  id="server-action-new-channel"
                  onClick={() => {
                    handleCreateChannel(currentServer.categories[0].id);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  {t('Yeni Kanal Oluştur', 'Create Channel')}
                </button>
              )}

              {hasAdminPrivileges && (
                <button
                  id="server-action-settings"
                  onClick={() => {
                    onOpenServerSettings();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  {t('Sunucu Ayarları', 'Server Settings')}
                </button>
              )}

              {myRole === 'owner' && (
                <button
                  id="server-action-delete"
                  onClick={handleDeleteServer}
                  className="w-full text-left px-2.5 py-2 hover:bg-red-600/20 rounded text-xs font-bold text-red-400 hover:text-red-300 transition border-t border-white/5 mt-1"
                >
                  {t('Sunucuyu Tamamen Sil', 'Delete Server Permanently')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-3.5 pt-3 pb-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Kanallarda ara...', 'Search channels...')}
              className="w-full bg-black/45 border border-white/5 rounded-xl pl-9 pr-8 py-1.5 text-xs text-gray-300 placeholder-gray-500 outline-none focus:border-indigo-500/50 transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Channels List */}
        <div className="p-3.5 space-y-4 overflow-y-auto max-h-[500px]">
          {currentServer.categories.map((category) => {
            // Filter channels based on search query
            const filteredChannels = category.channels.filter((channel) =>
              channel.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            // Hide category if searching and no channels match
            if (searchQuery && filteredChannels.length === 0) return null;

            return (
              <div key={category.id} className="space-y-1">
                
                {/* Category Header */}
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1.5 group">
                  <span className="truncate">{category.name}</span>
                  {hasAdminPrivileges && (
                    <button
                      id={`add-channel-btn-${category.id}`}
                      onClick={() => handleCreateChannel(category.id)}
                      className="p-0.5 rounded hover:bg-white/5 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                      title={t('Kanal Ekle', 'Add Channel')}
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>

                {/* Channels under Category */}
                <div className="space-y-0.5">
                  {filteredChannels.map((channel) => {
                  const isActive = activeChannelId === channel.id;
                  const isVoice = channel.type === 'voice';

                  return (
                    <div key={channel.id} className="group/channel flex items-center justify-between">
                      <button
                        id={`channel-btn-${channel.id}`}
                        onClick={() => {
                          if (isVoice) {
                            joinVoiceChannel(channel.id);
                            setActiveChannelId(channel.id);
                          } else {
                            setActiveChannelId(channel.id);
                          }
                        }}
                        className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition text-left ${
                          isActive && !isVoice
                            ? 'bg-white/10 text-white font-semibold'
                            : isVoice && voiceState.currentChannelId === channel.id
                            ? 'bg-indigo-600/20 text-green-400 font-semibold'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {isVoice ? <Volume2 size={16} className="text-gray-400 group-hover/channel:text-white" /> : <Hash size={16} className="text-gray-400 group-hover/channel:text-white" />}
                        <span className="truncate">{channel.name}</span>
                      </button>

                      {hasAdminPrivileges && (
                        <button
                          id={`del-channel-btn-${channel.id}`}
                          onClick={() => {
                            if (confirm(t('Bu kanalı silmek istiyor musunuz?', 'Are you sure you want to delete this channel?'))) {
                              deleteChannel(activeServerId, category.id, channel.id);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover/channel:opacity-100 hover:bg-white/5 rounded transition mr-1"
                          title={t('Kanalı Sil', 'Delete Channel')}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* User bar */}
      {renderUserBar()}

      {/* Add Channel Dialog */}
      {isAddChannelOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl text-white animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg font-display flex items-center gap-2">
                <Plus size={20} className="text-indigo-400" />
                {t('Kanal Oluştur', 'Create Channel')}
              </h3>
              <button 
                onClick={() => setIsAddChannelOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 uppercase font-semibold">{t('Kanal Türü', 'Channel Type')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewChannelType('text')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      newChannelType === 'text' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Hash size={18} />
                    <span className="text-xs font-semibold">Metin Kanalı</span>
                  </button>
                  <button
                    onClick={() => setNewChannelType('voice')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      newChannelType === 'voice' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Volume2 size={18} />
                    <span className="text-xs font-semibold">Sesli Kanal</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 uppercase font-semibold">{t('Kanal Adı', 'Channel Name')}</label>
                <input
                  type="text"
                  placeholder="sohbet-odasi"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAddChannelOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
              >
                {t('İptal', 'Cancel')}
              </button>
              <button
                onClick={submitCreateChannel}
                disabled={!newChannelName.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
              >
                {t('Kanal Oluştur', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
