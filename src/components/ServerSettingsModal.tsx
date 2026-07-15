import React, { useState, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { X, Shield, Plus, Trash2, Edit, Save, Palette, Settings, Users, Image as ImageIcon } from 'lucide-react';
import Avatar from './Avatar';
import { compressImage } from '../utils/imageCompressor';
import { Role } from '../types/chat';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { hex: '#ef4444', textClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20', label: 'Red' },
  { hex: '#f59e0b', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', label: 'Gold' },
  { hex: '#10b981', textClass: 'text-green-400', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20', label: 'Green' },
  { hex: '#3b82f6', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', label: 'Blue' },
  { hex: '#6366f1', textClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20', label: 'Indigo' },
  { hex: '#8b5cf6', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20', label: 'Purple' },
  { hex: '#f43f5e', textClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20', label: 'Pink' },
  { hex: '#14b8a6', textClass: 'text-teal-400', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20', label: 'Teal' },
];

export default function ServerSettingsModal({ isOpen, onClose }: ServerSettingsModalProps) {
  const { 
    servers, 
    activeServerId, 
    updateServer, 
    allUsers, 
    userServerRoles, 
    setUserServerRole,
    settings 
  } = useChatStore();

  const currentServer = servers.find(s => s.id === activeServerId);
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'members'>('general');

  // Local state for General
  const [serverName, setServerName] = useState(currentServer?.name || '');
  const [serverIcon, setServerIcon] = useState(currentServer?.icon || '');
  const [isSaved, setIsSaved] = useState(false);

  // Local state for Roles
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#6366f1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentServer) return null;

  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  // Ensure current server roles has a list
  const serverRoles: Role[] = currentServer.roles || [
    { id: 'admin', name: t('Yönetici', 'Admin'), color: '#f59e0b', permissions: { admin: true, manageChannels: true, kickMembers: true, banMembers: true, timeoutMembers: true, sendMessages: true } },
    { id: 'moderator', name: t('Moderatör', 'Moderator'), color: '#6366f1', permissions: { admin: false, manageChannels: true, kickMembers: true, banMembers: false, timeoutMembers: true, sendMessages: true } },
    { id: 'member', name: t('Üye', 'Member'), color: '#10b981', permissions: { admin: false, manageChannels: false, kickMembers: false, banMembers: false, timeoutMembers: false, sendMessages: true } },
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 150, 150, 0.7);
          setServerIcon(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneral = () => {
    if (!serverName.trim()) {
      alert(t('Sunucu adı boş olamaz!', 'Server name cannot be empty!'));
      return;
    }
    updateServer(activeServerId, {
      name: serverName.trim(),
      icon: serverIcon.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Custom role management
  const handleCreateRole = () => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: t('Yeni Rol', 'New Role'),
      color: '#6366f1',
      permissions: {
        admin: false,
        manageChannels: false,
        kickMembers: false,
        banMembers: false,
        timeoutMembers: false,
        sendMessages: true
      }
    };
    const updatedRoles = [...serverRoles, newRole];
    updateServer(activeServerId, { roles: updatedRoles });
    setEditingRoleId(newRole.id);
    setRoleName(newRole.name);
    setRoleColor(newRole.color);
  };

  const handleSaveRole = (roleId: string) => {
    const updatedRoles = serverRoles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          name: roleName.trim() || role.name,
          color: roleColor
        };
      }
      return role;
    });
    updateServer(activeServerId, { roles: updatedRoles });
    setEditingRoleId(null);
  };

  const handleDeleteRole = (roleId: string) => {
    if (roleId === 'admin' || roleId === 'moderator' || roleId === 'member') {
      alert(t('Varsayılan rolleri silemezsiniz!', 'You cannot delete default roles!'));
      return;
    }
    if (confirm(t('Bu rolü silmek istediğinize emin misiniz?', 'Are you sure you want to delete this role?'))) {
      const updatedRoles = serverRoles.filter(role => role.id !== roleId);
      updateServer(activeServerId, { roles: updatedRoles });
      setEditingRoleId(null);
    }
  };

  const getRoleBadgeColor = (roleId: string) => {
    const customRole = serverRoles.find(r => r.id === roleId);
    const colorHex = customRole?.color || '#6366f1';
    const preset = PRESET_COLORS.find(p => p.hex.toLowerCase() === colorHex.toLowerCase());
    if (preset) {
      return `${preset.textClass} ${preset.bgClass} ${preset.borderClass}`;
    }
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  };

  return (
    <div id="server-settings-modal" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-[#0c0f1d] border border-white/10 rounded-2xl flex text-white overflow-hidden shadow-2xl animate-scale-up">
        
        {/* Left tabs rail */}
        <div className="w-64 bg-black/45 border-r border-white/5 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400 truncate">
                {currentServer.name}
              </h2>
              <p className="text-[10px] text-gray-500 tracking-wider mt-0.5">
                {t('SUNUCU AYARLARI', 'SERVER SETTINGS')}
              </p>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'general' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings size={14} />
                {t('Genel Görünüm', 'Overview')}
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'roles' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Shield size={14} />
                {t('Rolleri Yönet', 'Roles Management')}
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'members' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users size={14} />
                {t('Üye Rol Atamaları', 'Members Roles')}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <X size={14} />
            {t('Kapat', 'Close')}
          </button>
        </div>

        {/* Right Content viewport */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar flex flex-col justify-between">
          <div>
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-display">{t('Sunucu Görünümü', 'Server Overview')}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('Sunucunun ismini ve logosunu buradan değiştirebilirsiniz.', 'Update your server name and brand logo details here.')}
                  </p>
                </div>

                <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {serverIcon.startsWith('data:') || serverIcon.startsWith('http') ? (
                      <img src={serverIcon} alt="Server logo" className="w-20 h-20 rounded-full object-cover border border-indigo-500/30" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center font-extrabold text-xl text-white border border-indigo-500/30">
                        {serverIcon || serverName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                      <ImageIcon size={18} className="text-white" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {t('SUNUCU ADI', 'SERVER NAME')}
                      </label>
                      <input
                        type="text"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSaveGeneral}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    {t('Değişiklikleri Kaydet', 'Save Changes')}
                  </button>
                  {isSaved && (
                    <span className="text-green-400 text-xs font-semibold animate-fade-in">
                      ✓ {t('Başarıyla kaydedildi!', 'Successfully updated!')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. ROLES TAB */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold font-display">{t('Sunucu Rolleri', 'Server Roles')}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('Üyeler için özel roller oluşturun, düzenleyin ve renklendirin.', 'Create, edit, and custom-color server roles.')}
                    </p>
                  </div>
                  <button
                    onClick={handleCreateRole}
                    className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus size={14} />
                    {t('Yeni Rol Oluştur', 'Create Role')}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Roles list */}
                  <div className="col-span-1 space-y-1.5 bg-white/[0.01] border border-white/5 p-3 rounded-2xl h-[50vh] overflow-y-auto no-scrollbar">
                    {serverRoles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setEditingRoleId(role.id);
                          setRoleName(role.name);
                          setRoleColor(role.color);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition border ${
                          editingRoleId === role.id 
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' 
                            : 'bg-transparent border-transparent text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                          <span>{role.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Editing role details panel */}
                  <div className="col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-2xl h-[50vh] overflow-y-auto no-scrollbar">
                    {editingRoleId ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                            {t('Rolü Düzenle', 'Edit Role')}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveRole(editingRoleId)}
                              className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                              title={t('Kaydet', 'Save')}
                            >
                              <Save size={14} />
                            </button>
                            {editingRoleId !== 'admin' && editingRoleId !== 'moderator' && editingRoleId !== 'member' && (
                              <button
                                onClick={() => handleDeleteRole(editingRoleId)}
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                title={t('Sil', 'Delete')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {t('ROL ADI', 'ROLE NAME')}
                            </label>
                            <input
                              type="text"
                              value={roleName}
                              onChange={(e) => setRoleName(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-xs transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Palette size={12} />
                              {t('ROL RENGİ', 'ROLE COLOR')}
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {PRESET_COLORS.map((preset) => (
                                <button
                                  key={preset.hex}
                                  onClick={() => setRoleColor(preset.hex)}
                                  className={`p-2 rounded-lg border text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${
                                    roleColor.toLowerCase() === preset.hex.toLowerCase()
                                      ? 'bg-indigo-600/20 border-indigo-500'
                                      : 'bg-white/5 border-transparent hover:border-white/10'
                                  }`}
                                  style={{ color: preset.hex }}
                                >
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.hex }} />
                                  <span>{preset.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                        <Shield size={36} className="text-gray-600 mb-2" />
                        <p className="text-xs font-semibold">{t('Düzenlemek için sol taraftan bir rol seçin.', 'Select a role from the left side to edit.')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MEMBERS TAB */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-display">{t('Üye Rol Atamaları', 'Members Roles')}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('Sunucudaki üyelerin rollerini hızlıca yönetin ve güncelleyin.', 'Quickly manage and update the roles of members in the server.')}
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto no-scrollbar">
                    {allUsers.filter(u => u.id !== 'bot-gemini').map((member) => {
                      const isOwner = member.id === currentServer.ownerId;
                      const activeRoleId = isOwner ? 'owner' : (userServerRoles[member.id]?.[activeServerId] || 'member');

                      return (
                        <div key={member.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar user={member} sizeClass="w-9 h-9" />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{member.username}</span>
                                {isOwner && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20 font-extrabold uppercase">
                                    {t('KURUCU', 'OWNER')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500">#{member.tag}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isOwner ? (
                              <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold">
                                {t('Kurucu', 'Owner')}
                              </span>
                            ) : (
                              <select
                                value={activeRoleId}
                                onChange={(e) => setUserServerRole(member.id, activeServerId, e.target.value)}
                                className="bg-[#111422] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-semibold outline-none focus:border-indigo-500"
                              >
                                {serverRoles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
