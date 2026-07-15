import React, { useState, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { X, User as UserIcon, Palette, Bell, Shield, Globe, Trash2, ShieldAlert, LogOut, Check } from 'lucide-react';
import Avatar from './Avatar';
import { compressImage } from '../utils/imageCompressor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { 
    currentUser, 
    setCurrentUser, 
    settings, 
    updateSettings, 
    systemLogs, 
    bannedUsers, 
    unbanUser, 
    activeServerId,
    servers 
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'privacy' | 'notifications' | 'theme' | 'logs' | 'banned'>('account');
  
  // Local form states
  const [username, setUsername] = useState(currentUser.username);
  const [tag, setTag] = useState(currentUser.tag || '');
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [banner, setBanner] = useState(currentUser.banner);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentServer = servers.find(s => s.id === activeServerId) || servers[0];
  const serverBannedIds = currentServer ? (bannedUsers[currentServer.id] || []) : [];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 150, 150, 0.7);
          setAvatar(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 400, 200, 0.7);
          setBanner(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert(t('Kullanıcı adı boş bırakılamaz!', 'Username cannot be empty!'));
      return;
    }

    let finalTag = tag.trim();

    if (!finalTag) {
      // If empty, auto-generate a 4-digit tag
      finalTag = Math.floor(1000 + Math.random() * 9000).toString();
      setTag(finalTag);
    }

    // Check duplicate of BOTH name and tag
    const isDuplicateCombo = useChatStore.getState().allUsers.some(
      (u) => u.id !== 'user-me' && 
             u.username.toLowerCase() === trimmedUsername.toLowerCase() && 
             u.tag === finalTag
    );
    if (isDuplicateCombo) {
      alert(t(
        'Bu kullanıcı adı ve hashtag kombinasyonu başka bir üye tarafından kullanılıyor! Lütfen farklı bir hashtag girin.',
        'This username and hashtag combination is already taken! Please enter a different hashtag.'
      ));
      return;
    }

    setCurrentUser({
      username: trimmedUsername,
      tag: finalTag,
      about: '',
      customStatus,
      avatar,
      banner,
      email,
      phoneNumber,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Language translation helper
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex w-full max-w-5xl h-[700px] rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl text-white">
        
        {/* Left tabs menu */}
        <div className="w-64 bg-black/35 border-r border-white/5 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
                {t('Kullanıcı Ayarları', 'User Settings')}
              </h3>
              <nav className="space-y-1">
                <button
                  id="settings-tab-account"
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'account' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <UserIcon size={16} />
                  {t('Hesabım', 'My Account')}
                </button>
                <button
                  id="settings-tab-profile"
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'profile' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Palette size={16} />
                  {t('Profil Teması', 'Profile Settings')}
                </button>
              </nav>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
                {t('Uygulama Ayarları', 'App Settings')}
              </h3>
              <nav className="space-y-1">
                <button
                  id="settings-tab-privacy"
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'privacy' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Shield size={16} />
                  {t('Gizlilik & Güvenlik', 'Privacy & Safety')}
                </button>
                <button
                  id="settings-tab-notifications"
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'notifications' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Bell size={16} />
                  {t('Bildirimler', 'Notifications')}
                </button>
                <button
                  id="settings-tab-theme"
                  onClick={() => setActiveTab('theme')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'theme' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Globe size={16} />
                  {t('Tema & Dil', 'Theme & Language')}
                </button>
              </nav>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
                {t('Sunucu Yönetimi', 'Server Management')}
              </h3>
              <nav className="space-y-1">
                <button
                  id="settings-tab-logs"
                  onClick={() => setActiveTab('logs')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'logs' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert size={16} />
                  {t('Denetim Kayıtları', 'Audit Logs')}
                </button>
                <button
                  id="settings-tab-banned"
                  onClick={() => setActiveTab('banned')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'banned' ? 'bg-indigo-600/30 text-indigo-400 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Trash2 size={16} />
                  {t('Yasaklı Üyeler', 'Banned Members')}
                </button>
              </nav>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <button 
              id="settings-btn-logout"
              onClick={onClose} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-sm font-medium transition duration-200"
            >
              <LogOut size={16} />
              {t('Kapat', 'Exit')}
            </button>
          </div>
        </div>

        {/* Right side content pane */}
        <div className="flex-1 bg-black/15 flex flex-col justify-between">
          
          {/* Header section */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold font-display">
                {activeTab === 'account' && t('Hesabım', 'My Account')}
                {activeTab === 'profile' && t('Kullanıcı Profili', 'User Profile')}
                {activeTab === 'privacy' && t('Gizlilik ve Güvenlik', 'Privacy & Safety')}
                {activeTab === 'notifications' && t('Bildirim Ayarları', 'Notification Settings')}
                {activeTab === 'theme' && t('Arayüz Tema & Dil Ayarları', 'App Appearance & Language')}
                {activeTab === 'logs' && t('Sunucu Denetim Günlüğü', 'Server Audit Logs')}
                {activeTab === 'banned' && t('Sunucu Yasaklılar Listesi', 'Server Ban List')}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {activeTab === 'account' && t('Kişisel bilgilerinizi ve şifrenizi yönetin.', 'Manage your personal credentials and preferences.')}
                {activeTab === 'profile' && t('Görsel temanızı ve avatarınızı özelleştirin.', 'Customize your visual style and avatar.')}
                {activeTab === 'privacy' && t('Çevrimiçi durumunuzun ve profilinizin görünürlüğünü kontrol edin.', 'Control your online presence and visibility settings.')}
                {activeTab === 'notifications' && t('Masaüstü bildirim sesleri ve uyarıları.', 'Desktop notification bells, sounds, and banners.')}
                {activeTab === 'theme' && t('Premium cam efektleri ve dil destek ayarları.', 'Premium glass themes and multi-language support.')}
                {activeTab === 'logs' && t('Bu sunucuda gerçekleşen tüm yönetimsel eylemlerin kaydı.', 'Records of all administrative events in this server.')}
                {activeTab === 'banned' && t('Sunucudan kalıcı olarak uzaklaştırılmış kullanıcılar.', 'Users permanently removed from this server workspace.')}
              </p>
            </div>
            <button 
              id="settings-close"
              onClick={onClose} 
              className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main settings body scrollable */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-5 rounded-xl bg-white/5 border border-white/5">
                  <div className="relative group">
                    <Avatar user={{ username, avatar }} sizeClass="w-20 h-20 text-2xl border-2 border-indigo-500" />
                    <button 
                      id="settings-avatar-change"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition text-xs font-medium cursor-pointer"
                    >
                      {t('Değiştir', 'Change')}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold flex items-center gap-1.5">
                      {currentUser.username}
                      <span className="text-gray-400 text-sm font-normal">#{currentUser.tag}</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('Avatarınızı güncellemek için görselin üzerine tıklayabilirsiniz.', 'Click on the avatar image to upload a new profile photo.')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      {t('Kullanıcı Adı', 'Username')}
                    </label>
                    <input 
                      id="settings-input-username"
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition"
                    />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      {t('Hashtag / Etiket', 'Hashtag / Tag')}
                    </label>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-3 focus-within:border-indigo-500 transition">
                      <span className="text-gray-500 font-bold select-none mr-1.5">#</span>
                      <input 
                        id="settings-input-tag"
                        type="text" 
                        maxLength={4}
                        placeholder="0001"
                        value={tag}
                        onChange={(e) => setTag(e.target.value.replace(/\D/g, ''))} // only allow digits
                        className="w-full py-2.5 bg-transparent outline-none text-sm text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      {t('Özel Durum Mesajı', 'Custom Status')}
                    </label>
                    <input 
                      id="settings-input-status"
                      type="text" 
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder={t('Kendin belirle...', 'Set status...')}
                      className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      {t('E-posta', 'Email')}
                    </label>
                    <input 
                      id="settings-input-email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@mail.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      {t('Telefon Numarası', 'Phone Number')}
                    </label>
                    <input 
                      id="settings-input-phone"
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+90 555 555 5555"
                      className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Profile Banner Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    {t('Profil Bannerı', 'Profile Banner')}
                  </label>
                  <div className="relative rounded-xl h-36 border border-white/10 overflow-hidden flex items-end justify-between p-4" style={{ background: banner.includes('gradient') ? banner : `url(${banner}) center/cover` }}>
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs">
                      {t('Mevcut Önizleme', 'Live Banner Preview')}
                    </div>
                    <button 
                      id="settings-banner-change"
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium cursor-pointer transition shadow"
                    >
                      {t('Yeni Görsel Yükle', 'Upload New')}
                    </button>
                    <input 
                      type="file" 
                      ref={bannerInputRef} 
                      onChange={handleBannerChange} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    {t('Hazır Renk Paletleri', 'Ready-to-use Gradient Presets')}
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'Cosmic Indigo', value: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' },
                      { name: 'Royal Velvet', value: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)' },
                      { name: 'Neon Forest', value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
                      { name: 'Amber Glow', value: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setBanner(preset.value)}
                        className={`p-3 rounded-lg border text-xs font-medium transition flex flex-col items-center gap-2 ${
                          banner === preset.value ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="w-full h-8 rounded-md" style={{ background: preset.value }} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <h4 className="text-sm font-semibold">{t('Çevrimiçi Durumumu Göster', 'Show Online Status')}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('Sunucudaki diğer üyelerin aktif durumunuzu görebilmesini sağlar.', 'Allows members of your servers to see when you are online/idle.')}
                    </p>
                  </div>
                  <button
                    id="settings-toggle-privacy-status"
                    onClick={() => updateSettings({ privacyShowStatus: !settings.privacyShowStatus })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      settings.privacyShowStatus ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      settings.privacyShowStatus ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <h4 className="text-sm font-semibold">{t('Güvenli Mesajlaşma', 'Safe Messaging Direct Filters')}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('Gelen doğrudan mesajları zararlı içeriklere karşı otomatik olarak tarayın.', 'Automatically scan incoming direct messages for harmful links/media.')}
                    </p>
                  </div>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full font-semibold">
                    {t('Süper Güvenli Aktif', 'Fully Shielded')}
                  </span>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <h4 className="text-sm font-semibold">{t('Masaüstü Bildirimleri', 'Desktop Push Notifications')}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('Mesaj geldiğinde anlık masaüstü bildirimleri gönderilsin.', 'Receive floating desktop push notifications on new mentions.')}
                    </p>
                  </div>
                  <button
                    id="settings-toggle-notifications"
                    onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      settings.notificationsEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <h4 className="text-sm font-semibold">{t('Ses Efektleri', 'Interface Sound Effects')}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('Ses kanallarına katılırken, ayrılırken ve mesaj geldiğinde çalınacak sesler.', 'Play premium notification chimes when joining channels or sending.')}
                    </p>
                  </div>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full font-semibold">
                    {t('Aktif', 'Active')}
                  </span>
                </div>
              </div>
            )}

            {/* Theme & Language Settings */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    {t('Görsel Tema Tarzı', 'Visual Theme')}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      id="settings-theme-dark"
                      onClick={() => updateSettings({ theme: 'dark' })}
                      className={`p-4 rounded-xl border text-left transition ${
                        settings.theme === 'dark' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <h4 className="font-semibold text-sm">Deep Space Dark</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('Karanlık ve yüksek kontrastlı şık siyah tema.', 'Clean, high-contrast dark palette for night geeks.')}
                      </p>
                    </button>
                    <button
                      id="settings-theme-glass"
                      onClick={() => updateSettings({ theme: 'glass' })}
                      className={`p-4 rounded-xl border text-left transition ${
                        settings.theme === 'glass' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <h4 className="font-semibold text-sm">Glassmorphism Premium</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('Şeffaf cam efekti, buzlu arka plan ve parlak kenarlar.', 'Frosted glass panels with glowing neon subtle border grids.')}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    {t('Uygulama Dili', 'Application Language')}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      id="settings-lang-tr"
                      onClick={() => updateSettings({ language: 'tr' })}
                      className={`p-3 rounded-lg border text-center font-medium text-sm transition ${
                        settings.language === 'tr' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 hover:border-white/20 text-gray-400'
                      }`}
                    >
                      Türkçe (TR)
                    </button>
                    <button
                      id="settings-lang-en"
                      onClick={() => updateSettings({ language: 'en' })}
                      className={`p-3 rounded-lg border text-center font-medium text-sm transition ${
                        settings.language === 'en' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 hover:border-white/20 text-gray-400'
                      }`}
                    >
                      English (EN)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {systemLogs.filter(log => log.serverId === activeServerId).length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                      {t('Henüz herhangi bir denetim kaydı bulunmuyor.', 'No audit logs recorded for this server yet.')}
                    </div>
                  ) : (
                    systemLogs
                      .filter(log => log.serverId === activeServerId)
                      .map((log) => (
                        <div key={log.id} className="p-3.5 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-indigo-400">[{log.type}]</span>
                            <p className="text-gray-300 font-medium">{log.details}</p>
                            <p className="text-[10px] text-gray-500">
                              {t('Tarafından:', 'Executor:')} <span className="text-gray-400">{log.executor}</span>
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Banned Users Tab */}
            {activeTab === 'banned' && (
              <div className="space-y-3">
                {serverBannedIds.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    {t('Bu sunucuda yasaklanmış herhangi bir üye yok.', 'No members are currently banned from this server.')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {serverBannedIds.map((bannedId) => {
                      const user = useChatStore.getState().allUsers.find(u => u.id === bannedId);
                      return (
                        <div key={bannedId} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <img src={user?.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <h4 className="text-sm font-semibold">{user?.username}</h4>
                              <p className="text-xs text-gray-400">#{user?.tag}</p>
                            </div>
                          </div>
                          <button
                            id={`settings-unban-${bannedId}`}
                            onClick={() => unbanUser(currentServer.id, bannedId)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                          >
                            {t('Yasağı Kaldır', 'Unban Member')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Save Section */}
          <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <div>
              {isSaved && (
                <span className="text-green-400 text-sm flex items-center gap-1.5 animate-bounce">
                  <Check size={16} />
                  {t('Başarıyla kaydedildi!', 'Saved successfully!')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                id="settings-cancel-btn"
                onClick={onClose} 
                className="px-4 py-2 hover:bg-white/5 rounded-lg text-sm font-semibold text-gray-400 hover:text-white transition"
              >
                {t('Kapat', 'Close')}
              </button>
              {(activeTab === 'account' || activeTab === 'profile') && (
                <button 
                  id="settings-save-btn"
                  onClick={handleSaveProfile} 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition duration-200 shadow"
                >
                  {t('Değişiklikleri Kaydet', 'Save Changes')}
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
