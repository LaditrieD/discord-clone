import React, { useState } from 'react';
import { useChatStore } from './store/chatStore';
import SidebarServers from './components/SidebarServers';
import SidebarChannels from './components/SidebarChannels';
import ChatArea from './components/ChatArea';
import RightSidebarUsers from './components/RightSidebarUsers';
import VoiceChannelControls from './components/VoiceChannelControls';
import SettingsModal from './components/SettingsModal';
import ServerSettingsModal from './components/ServerSettingsModal';
import { Plus, X, Globe, MessageSquare, ShieldCheck, Gamepad2, Info, Lock, Eye, EyeOff, Mail, Phone, Send, ArrowLeft } from 'lucide-react';
import { compressImage } from './utils/imageCompressor';

export default function App() {
  const { 
    currentUser, 
    setCurrentUser, 
    activeServerId, 
    activeChannelId, 
    addServer, 
    servers, 
    voiceState, 
    settings 
  } = useChatStore();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Login form local states
  const [loginUsername, setLoginUsername] = useState(currentUser.username);
  const [loginTag, setLoginTag] = useState(currentUser.tag);
  const [loginAvatar, setLoginAvatar] = useState(currentUser.avatar);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState(currentUser.email || '');
  const [loginPhoneNumber, setLoginPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password flow states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetInput, setResetInput] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Modals visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [showVoiceView, setShowVoiceView] = useState(false);

  // Add Server / Group Form state
  const [newServerName, setNewServerName] = useState('');
  const [newServerIcon, setNewServerIcon] = useState('');
  const [newServerType, setNewServerType] = useState<'server' | 'group'>('server');
  const [newServerLogo, setNewServerLogo] = useState('');
  const [newServerLogoUrl, setNewServerLogoUrl] = useState('');

  // Translation helper
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 150, 150, 0.7);
          setLoginAvatar(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServerLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 150, 150, 0.7);
          setNewServerLogo(compressed);
          setNewServerLogoUrl(''); // Reset url if file is selected
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) return;
    if (loginPassword.length < 4) {
      alert(t('Şifre en az 4 karakter uzunluğunda olmalıdır!', 'Password must be at least 4 characters long!'));
      return;
    }

    if (!loginEmail.trim() && !loginPhoneNumber.trim()) {
      alert(t('Lütfen devam etmek için E-posta veya Telefon Numarasından en az birini doldurun!', 'Please fill in either Email or Phone Number to proceed!'));
      return;
    }

    // Auto-generate a unique tag
    let finalTag = Math.floor(1000 + Math.random() * 9000).toString();
    let attempts = 0;
    while (attempts < 50) {
      const isDuplicateCombo = useChatStore.getState().allUsers.some(
        (u) => u.id !== 'user-me' && 
               u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
               u.tag === finalTag
      );
      if (!isDuplicateCombo) {
        break;
      }
      finalTag = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    }

    setCurrentUser({
      username: loginUsername.trim(),
      tag: finalTag,
      avatar: loginAvatar,
      about: '',
      email: loginEmail,
      phoneNumber: loginPhoneNumber,
    });
    setIsLoggedIn(true);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetInput.trim()) return;
    setIsSendingReset(true);
    setResetStatus(null);

    // Simulate network delay of 1.5 seconds
    setTimeout(() => {
      setIsSendingReset(false);
      const tempPass = Math.random().toString(36).substring(2, 10).toUpperCase();
      if (resetMethod === 'email') {
        setResetStatus({
          success: true,
          message: t(
            `Şifre sıfırlama linki ve geçici şifreniz (${tempPass}) "${resetInput}" e-posta adresine başarıyla gönderildi! Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.`,
            `Password reset link and temporary password (${tempPass}) sent successfully to "${resetInput}"! Please check your inbox and spam folders.`
          )
        });
      } else {
        setResetStatus({
          success: true,
          message: t(
            `Sıfırlama SMS'i ve geçici şifreniz (${tempPass}) "${resetInput}" numaralı telefona başarıyla gönderildi! Lütfen SMS kutunuzu kontrol edin.`,
            `Reset SMS and temporary password (${tempPass}) sent successfully to "${resetInput}"! Please check your text messages.`
          )
        });
      }
    }, 1500);
  };

  const handleCreateServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newServerName.trim()) {
      const finalIcon = newServerLogoUrl.trim() || newServerLogo || newServerIcon.trim().toUpperCase().substring(0, 2) || newServerName.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      addServer(newServerName.trim(), finalIcon, newServerType === 'group');
      setNewServerName('');
      setNewServerIcon('');
      setNewServerLogo('');
      setNewServerLogoUrl('');
      setNewServerType('server');
      setIsAddServerOpen(false);
    }
  };

  // If not logged in, render the gorgeous glassmorphic login / registration gateway
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-[#070812] flex items-center justify-center font-sans p-6 select-none relative overflow-hidden">
        
        {/* Fixed Mesh Background */}
        <div className="mesh-bg" />
        
        {/* Neon decorative background blobs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 filter blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-600/10 filter blur-[120px]" />

        <div className="w-full max-w-lg rounded-3xl glass-panel border border-white/10 p-10 text-white shadow-2xl relative z-10 space-y-8">
          
          {/* Brand header display */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 animate-pulse-slow">
              <Gamepad2 size={36} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Kozmik Chat 🌌
            </h1>
            <p className="text-xs text-gray-400">
              {t('Yapay zeka destekli premium masaüstü sohbet deneyimi', 'AI-powered premium desktop chatting network')}
            </p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              
              {/* Avatar picker profile setup */}
              <div className="flex flex-col items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {t('Profil Resmi', 'Choose Avatar')}
                </label>
                <div className="relative group cursor-pointer">
                  {loginAvatar ? (
                    <img 
                      src={loginAvatar} 
                      alt="avatar preview" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/50 shadow-lg" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 border-2 border-indigo-500/50 flex items-center justify-center shadow-lg text-white font-extrabold text-2xl uppercase select-none">
                      {loginUsername ? loginUsername.substring(0, 2).toUpperCase() : '?'}
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="login-avatar-file"
                    onChange={handleAvatarChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer rounded-full" 
                    accept="image/*" 
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 text-[10px] font-semibold text-white">
                    {t('Dosya Seç', 'Upload')}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  {t('Profil fotoğrafınızı kendiniz belirlemek için tıklayıp yükleyebilirsiniz.', 'Click on the circle to upload your custom profile picture.')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {t('Kullanıcı Adı', 'Username')}
                  </label>
                  <input 
                    id="login-username-input"
                    type="text" 
                    required
                    placeholder="KozmikGamer"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {t('E-posta veya Telefon (En az biri yeterlidir)', 'Email or Phone (At least one is required)')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                        <Mail size={11} className="text-indigo-400" />
                        {t('E-posta', 'Email')}
                      </label>
                      <input 
                        id="login-email-input"
                        type="email" 
                        placeholder="ornek@mail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-xs transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                        <Phone size={11} className="text-indigo-400" />
                        {t('Telefon Numarası', 'Phone Number')}
                      </label>
                      <input 
                        id="login-phone-input"
                        type="text" 
                        placeholder="+90 555 555 5555"
                        value={loginPhoneNumber}
                        onChange={(e) => setLoginPhoneNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-xs transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {t('Şifre', 'Password')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetStatus(null);
                        setResetInput('');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition font-semibold"
                    >
                      {t('Şifremi Unuttum?', 'Forgot Password?')}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      id="login-password-input"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm transition"
                    />
                    <div className="absolute left-3.5 top-3.5 text-gray-500">
                      <Lock size={16} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                id="login-connect-submit"
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition duration-300 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                {t('Kozmosa Bağlan', 'Connect to Kozmik')}
              </button>

            </form>
          ) : (
            /* Forgot Password Flow UI */
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowForgotPassword(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm font-bold text-gray-300">{t('Giriş Ekranına Dön', 'Back to Login')}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">{t('Şifre Sıfırlama', 'Password Recovery')}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('Kayıtlı e-posta adresinizi veya telefon numaranızı girerek geçici bir şifre ve sıfırlama kodu talep edebilirsiniz.', 'Enter your registered email address or phone number to retrieve a temporary password.')}
                </p>
              </div>

              {/* Retrieval Method Choice */}
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => {
                    setResetMethod('email');
                    setResetInput('');
                    setResetStatus(null);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    resetMethod === 'email' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mail size={14} />
                  {t('E-posta', 'Email')}
                </button>
                <button
                  onClick={() => {
                    setResetMethod('phone');
                    setResetInput('');
                    setResetStatus(null);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    resetMethod === 'phone' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Phone size={14} />
                  {t('Telefon SMS', 'Phone SMS')}
                </button>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {resetMethod === 'email' ? t('E-posta Adresi', 'Email Address') : t('Telefon Numarası', 'Phone Number')}
                  </label>
                  <input
                    type={resetMethod === 'email' ? 'email' : 'text'}
                    required
                    placeholder={resetMethod === 'email' ? 'ornek@mail.com' : '+90 555 555 5555'}
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                >
                  {isSendingReset ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      {t('Geçici Şifre Gönder', 'Send Temporary Password')}
                    </>
                  )}
                </button>
              </form>

              {resetStatus && (
                <div className={`p-4 rounded-xl border leading-relaxed text-xs ${
                  resetStatus.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                  {resetStatus.message}
                </div>
              )}
            </div>
          )}

          {/* Guest account details info */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3 text-xs text-indigo-300">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              {t('Bu uygulama sadece masaüstü (bilgisayar) ekranları için tasarlanmıştır. Genişlik en az 1280px olmalıdır.', 'This premium chat client is exclusively optimized for desktop computer viewports (min-width: 1280px).')}
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Choose between active channel viewport types
  const isInVoiceChannel = voiceState.currentChannelId !== null;

  return (
    <div className="min-w-[1280px] h-screen select-none font-sans flex text-white overflow-hidden bg-transparent">
      {/* Fixed Mesh Background */}
      <div className="mesh-bg" />
      
      {/* 1. Leftmost server icons navigation rail */}
      <SidebarServers 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFriends={() => useChatStore.getState().setActiveChannelId('dm-friends')}
        onOpenAddServer={() => setIsAddServerOpen(true)}
      />

      {/* 2. Secondary channels list sidebar */}
      <SidebarChannels 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenServerSettings={() => setIsServerSettingsOpen(true)}
      />

      {/* 3. Center workspace viewport timeline swap */}
      {isInVoiceChannel && activeChannelId === voiceState.currentChannelId ? (
        <VoiceChannelControls />
      ) : (
        <ChatArea />
      )}

      {/* 4. Rightmost server members list rail (Hidden in DMs for clutter-free design) */}
      {activeServerId !== 'dm' && <RightSidebarUsers />}

      {/* Global settings dashboard modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Server Settings Modal */}
      <ServerSettingsModal
        isOpen={isServerSettingsOpen}
        onClose={() => setIsServerSettingsOpen(false)}
      />

      {/* Create Server/Group Dialog overlay popup */}
      {isAddServerOpen && (
        <div id="add-server-modal" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-white animate-scale-up space-y-4">
            
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg font-display flex items-center gap-2 text-indigo-400">
                <Plus size={20} />
                {newServerType === 'server' ? t('Yeni Sunucu Oluştur', 'Create a Server') : t('Yeni Grup Oluştur', 'Create a Group')}
              </h3>
              <button 
                onClick={() => {
                  setIsAddServerOpen(false);
                  setNewServerLogo('');
                  setNewServerLogoUrl('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Type toggle selector */}
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setNewServerType('server')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition ${
                  newServerType === 'server' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('Sunucu (Topluluk)', 'Server (Community)')}
              </button>
              <button
                type="button"
                onClick={() => setNewServerType('group')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition ${
                  newServerType === 'group' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('Grup (Arkadaşlar)', 'Group (Friends)')}
              </button>
            </div>

            <form onSubmit={handleCreateServerSubmit} className="space-y-4">
              
              {/* Logo upload and preview */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {t('Grup / Sunucu Logosu', 'Group / Server Logo')}
                </label>
                <div className="relative group cursor-pointer">
                  {newServerLogo || newServerLogoUrl ? (
                    <img 
                      src={newServerLogo || newServerLogoUrl} 
                      alt="server logo preview" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-950 border-2 border-white/10 flex items-center justify-center shadow-lg text-white font-extrabold text-xl uppercase select-none">
                      {newServerName ? newServerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?'}
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="server-logo-file"
                    onChange={handleServerLogoChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer rounded-2xl" 
                    accept="image/*" 
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 text-[10px] font-semibold text-white">
                    {t('Dosya Seç', 'Upload')}
                  </div>
                </div>
                {(newServerLogo || newServerLogoUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewServerLogo('');
                      setNewServerLogoUrl('');
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    {t('Logoyu Kaldır', 'Remove Logo')}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 uppercase font-semibold">
                  {newServerType === 'server' ? t('Sunucu Adı', 'Server Name') : t('Grup Adı', 'Group Name')}
                </label>
                <input
                  id="add-server-input-name"
                  type="text"
                  required
                  placeholder={newServerType === 'server' ? "Kozmik Oyuncular" : "Bizim Ekip"}
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              {/* Logo URL (Alternative option) */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 uppercase font-semibold">
                  {t('Görsel URL (Opsiyonel Link)', 'Image URL (Optional Link)')}
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={newServerLogoUrl}
                  onChange={(e) => {
                    setNewServerLogoUrl(e.target.value);
                    if (e.target.value.trim()) setNewServerLogo(''); // Reset uploaded file
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-xs"
                />
              </div>

              {/* Icon abbreviation (Fallback option, explicitly optional!) */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 uppercase font-semibold">
                  {t('İkon Kısaltması (Seçenek, 2 Harf)', 'Icon Abbreviation (Optional, 2 Letters)')}
                </label>
                <input
                  id="add-server-input-icon"
                  type="text"
                  maxLength={2}
                  placeholder={newServerName ? newServerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'GK'}
                  value={newServerIcon}
                  onChange={(e) => setNewServerIcon(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 outline-none text-sm uppercase"
                />
                <p className="text-[10px] text-gray-500 leading-normal">
                  {t('*Logo eklediğinizde bu kısaltma yerine doğrudan yüklediğiniz logo görüntülenecektir.', '*When you add a logo, it will be rendered directly instead of this abbreviation.')}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  id="add-server-cancel"
                  type="button"
                  onClick={() => {
                    setIsAddServerOpen(false);
                    setNewServerLogo('');
                    setNewServerLogoUrl('');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
                >
                  {t('İptal', 'Cancel')}
                </button>
                <button
                  id="add-server-submit"
                  type="submit"
                  disabled={!newServerName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                >
                  {t('Oluştur', 'Create')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
