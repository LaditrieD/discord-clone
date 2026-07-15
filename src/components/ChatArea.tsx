import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  Hash, Search, Pin, MessageSquare, Smile, Plus, Image as ImageIcon, 
  Send, X, Edit2, Trash2, CornerUpLeft, MessageCircle, AlertCircle, 
  Paperclip, Copy, Check, Users, UserPlus, ShieldAlert, Sparkles 
} from 'lucide-react';
import { Message, Attachment } from '../types/chat';
import Avatar from './Avatar';
import { compressImage } from '../utils/imageCompressor';

export default function ChatArea() {
  const { 
    currentUser,
    servers, 
    activeServerId, 
    activeChannelId, 
    messages, 
    sendMessage, 
    editMessage, 
    deleteMessage, 
    togglePinMessage, 
    addReaction,
    typingUsers, 
    allUsers, 
    friends, 
    blocked, 
    addFriend, 
    removeFriend,
    settings 
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  // Custom attachment files
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emojis & GIFs panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Friends form
  const [friendInput, setFriendInput] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Translation helper
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  const currentServer = servers.find((s) => s.id === activeServerId);
  
  // Find current channel
  let currentChannel = currentServer
    ?.categories.flatMap((cat) => cat.channels)
    .find((ch) => ch.id === activeChannelId);

  // If inside DMs
  const isDm = activeServerId === 'dm';

  // Format channel name or DM header
  let channelTitle = currentChannel?.name || 'genel-sohbet';
  let channelTopic = currentChannel?.topic || 'Sohbet etmeye başlayın!';

  if (isDm) {
    if (activeChannelId === 'dm-friends') {
      channelTitle = t('Arkadaşlar', 'Friends Directory');
      channelTopic = t('Tüm arkadaşlarınızı ve istekleri yönetin.', 'Manage your gaming buddies and blocklists.');
    } else if (activeChannelId === 'dm-zeynep') {
      channelTitle = 'Zeynep_Dev';
      channelTopic = 'Full-stack React Geliştirici • Çevrimiçi';
    } else if (activeChannelId === 'dm-gezgin') {
      channelTitle = 'KozmikGezgin';
      channelTopic = 'Astronomi Tutkunu • Boşta';
    } else if (activeChannelId === 'dm-gamer') {
      channelTitle = 'Gamer35';
      channelTopic = 'Hardcore Gamer • Rahatsız Etmeyin';
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    await sendMessage(inputText, replyMessageId || undefined, attachments);
    setInputText('');
    setReplyMessageId(null);
    setAttachments([]);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const isImage = file.type.startsWith('image/');
          let finalUrl = reader.result;
          if (isImage) {
            finalUrl = await compressImage(reader.result, 400, 400, 0.6);
          }
          const newAttachment: Attachment = {
            name: file.name,
            type: isImage ? 'image' : 'file',
            url: finalUrl,
          };
          setAttachments([...attachments, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = friendInput.trim();
    if (!rawInput) return;

    let searchName = rawInput;
    let searchTag = '';

    if (rawInput.includes('#')) {
      const parts = rawInput.split('#');
      searchName = parts[0].trim();
      searchTag = parts[1].trim();
    }

    // Find in allUsers
    const found = allUsers.find((u) => {
      const nameMatch = u.username.toLowerCase() === searchName.toLowerCase();
      const tagMatch = searchTag ? u.tag === searchTag : true;
      return nameMatch && tagMatch;
    });

    if (found) {
      if (found.id === 'user-me') {
        setFriendSuccess(t('Kendinizi arkadaş ekleyemezsiniz!', "You can't add yourself!"));
      } else if (friends.includes(found.id)) {
        setFriendSuccess(t(`${found.username} zaten arkadaş listenizde!`, `${found.username} is already your friend!`));
      } else {
        addFriend(found.id);
        const tagSuffix = found.tag ? `#${found.tag}` : '';
        setFriendSuccess(t(`${found.username}${tagSuffix} başarıyla arkadaş eklendi!`, `${found.username}${tagSuffix} added to friends!`));
      }
    } else {
      setFriendSuccess(t('Kullanıcı bulunamadı. Lütfen "KullanıcıAdı#Etiket" biçiminde girin (Örn: Zeynep_Dev#0034 veya Gamer35#0035).', 'User not found. Try entering in "Username#Tag" format (e.g. Zeynep_Dev#0034 or Gamer35#0035).'));
    }
    setFriendInput('');
    setTimeout(() => setFriendSuccess(''), 5000);
  };

  // Custom simplistic markdown + code highlights parser
  const renderMessageContent = (content: string) => {
    if (!content) return null;

    // Code blocks parser ```typescript code ```
    if (content.includes('```')) {
      const parts = content.split('```');
      return (
        <div className="space-y-1.5 my-1.5">
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              const lines = part.split('\n');
              const language = lines[0] || 'typescript';
              const code = lines.slice(1).join('\n');
              return (
                <div key={index} className="rounded-xl overflow-hidden bg-black/65 border border-white/5 font-mono text-xs text-indigo-200">
                  <div className="bg-white/5 px-4 py-2 flex justify-between items-center text-[10px] text-gray-400 font-sans border-b border-white/5">
                    <span className="uppercase font-semibold tracking-wider">{language}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        alert(t('Kod panoya kopyalandı!', 'Code copied to clipboard!'));
                      }}
                      className="hover:text-white flex items-center gap-1 transition"
                    >
                      <Copy size={12} /> {t('Kopyala', 'Copy')}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto whitespace-pre-wrap">{code}</pre>
                </div>
              );
            }
            return <p key={index} className="whitespace-pre-wrap leading-relaxed text-gray-200 text-sm">{part}</p>;
          })}
        </div>
      );
    }

    // Bold tags parser **text**
    let formattedText = content;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const matches = Array.from(formattedText.matchAll(boldRegex));
    if (matches.length > 0) {
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-gray-200 text-sm">
          {content.split('**').map((chunk, i) => {
            if (i % 2 === 1) {
              return <strong key={i} className="font-bold text-white bg-indigo-500/10 px-1 rounded">{chunk}</strong>;
            }
            return chunk;
          })}
        </p>
      );
    }

    // Header parser ## Header
    if (content.startsWith('## ')) {
      return <h4 className="text-base font-bold text-white font-display border-b border-white/5 pb-1 mt-2 mb-1">{content.replace('## ', '')}</h4>;
    }

    return <p className="whitespace-pre-wrap leading-relaxed text-gray-200 text-sm">{content}</p>;
  };

  // Channel specific messages filtering by search query
  const rawChannelMessages = messages[activeChannelId] || [];
  const channelMessages = rawChannelMessages.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedMessages = rawChannelMessages.filter(m => m.isPinned);

  const typingList = typingUsers[activeChannelId] || [];

  return (
    <div id="chat-area-main" className="flex-1 bg-transparent flex flex-col justify-between overflow-hidden relative text-white">
      
      {/* 1. Header Channel Title Bar */}
      <div className="h-14 bg-white/[0.01] backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10 select-none">
        <div className="flex items-center gap-3 truncate">
          {isDm ? (
            <MessageSquare size={18} className="text-indigo-400 shrink-0 animate-pulse" />
          ) : (
            <Hash size={18} className="text-gray-400 shrink-0" />
          )}
          <div className="truncate">
            <h2 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5 font-display">
              {channelTitle}
            </h2>
            <p className="text-[10px] text-gray-400 truncate mt-0.5 max-w-[400px]">
              {channelTopic}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          
          {/* Messages Search Input */}
          {activeChannelId !== 'dm-friends' && (
            <div className="relative">
              <input 
                id="chat-search-input"
                type="text" 
                placeholder={t('Mesajlarda ara...', 'Search messages...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 hover:text-white text-gray-400">
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Pinned Messages Trigger */}
          {activeChannelId !== 'dm-friends' && (
            <button 
              id="chat-pins-toggle"
              onClick={() => setShowPins(!showPins)}
              className={`p-1.5 rounded-lg transition ${
                showPins ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={t('Sabitlenen Mesajlar', 'Pinned Messages')}
            >
              <Pin size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main content swap box (Chat messages OR Friends manager) */}
      {isDm && activeChannelId === 'dm-friends' ? (
        
        // FRIENDS MANAGER INTERFACE
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-3 gap-6">
            
            {/* Friends list pane */}
            <div className="col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-bold text-sm tracking-wider uppercase text-gray-400 flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  {t(`Arkadaşlarım (${friends.length})`, `All Buddies (${friends.length})`)}
                </h3>
              </div>

              {friends.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400 bg-white/5 border border-white/5 rounded-2xl">
                  {t('Sanal dünyada henüz arkadaşınız yok. Hemen sağdaki panelden ekleyin!', 'No offline or online buddies registered. Use the panel on the right to search and add!')}
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friendId) => {
                    const user = allUsers.find((u) => u.id === friendId);
                    if (!user) return null;

                    return (
                      <div key={friendId} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-black ${
                              user.status === 'online' ? 'bg-green-500' : user.status === 'idle' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{user.username} <span className="text-gray-500 text-xs">#{user.tag}</span></h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.customStatus}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id={`friend-dm-${friendId}`}
                            onClick={() => {
                              // Link to DM channel of this user
                              const dmMap: Record<string, string> = {
                                'user-1': 'dm-zeynep',
                                'user-2': 'dm-gezgin',
                                'user-3': 'dm-gamer'
                              };
                              useChatStore.getState().setActiveChannelId(dmMap[friendId] || 'dm-zeynep');
                            }}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                            title={t('Sohbet Başlat', 'Send Direct Message')}
                          >
                            <MessageCircle size={14} />
                          </button>
                          <button
                            id={`friend-remove-${friendId}`}
                            onClick={() => removeFriend(friendId)}
                            className="p-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition"
                            title={t('Arkadaşlıktan Çıkar', 'Remove Buddy')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Friend Sidebar forms */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm tracking-wider uppercase text-gray-300 flex items-center gap-2 border-b border-white/5 pb-2">
                  <UserPlus size={16} className="text-green-400" />
                  {t('Arkadaş Ekle', 'Add Buddy')}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('Gamer tag olmadan tam kullanıcı adını yazarak topluluktaki diğer insanları ekleyebilirsiniz.', 'Type full username to locate other members in the server cluster.')}
                </p>

                <form onSubmit={handleAddFriendSubmit} className="space-y-3">
                  <input
                    id="add-friend-input"
                    type="text"
                    placeholder="Örn: Zeynep_Dev"
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs focus:border-green-500 outline-none transition"
                  />
                  <button
                    id="add-friend-submit"
                    type="submit"
                    className="w-full py-2 bg-green-600 hover:bg-green-700 font-bold text-xs rounded-xl transition shadow"
                  >
                    {t('Arkadaşlık İsteği Gönder', 'Send Buddy Request')}
                  </button>
                </form>

                {friendSuccess && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300">
                    {friendSuccess}
                  </div>
                )}
              </div>

              {/* Engellenenler / Blocklist overview */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-400" />
                  {t('Engelli Listesi', 'Blocklist')} ({blocked.length})
                </h4>
                {blocked.length === 0 ? (
                  <p className="text-[10px] text-gray-400">{t('Harika! Engellenmiş kimse yok.', 'All clear! No blocked profiles.')}</p>
                ) : (
                  <div className="space-y-1.5">
                    {blocked.map((blockId) => {
                      const user = allUsers.find(u => u.id === blockId);
                      return (
                        <div key={blockId} className="flex justify-between items-center text-xs">
                          <span className="text-gray-300 font-semibold">{user?.username}</span>
                          <button 
                            id={`unblock-${blockId}`}
                            onClick={() => useChatStore.getState().toggleBlockUser(blockId)}
                            className="text-[10px] text-green-400 hover:underline"
                          >
                            {t('Engeli Kaldır', 'Unblock')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      ) : (

        // STANDARD CHAT AREA INTERFACE WITH ACTIVE TIMELINE & MESSAGES
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          
          {/* Pinsboard float overlay panel card */}
          {showPins && (
            <div id="pins-overlay" className="absolute top-2 right-4 w-96 max-h-[350px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-md z-40 p-4 shadow-2xl animate-scale-up space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                <h4 className="font-bold text-xs tracking-wider uppercase text-indigo-400 flex items-center gap-1.5">
                  <Pin size={12} />
                  {t('Sabitlenen Mesajlar', 'Pinned Channel Messages')} ({pinnedMessages.length})
                </h4>
                <button onClick={() => setShowPins(false)} className="text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              {pinnedMessages.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">{t('Bu kanalda sabitlenmiş herhangi bir mesaj bulunmuyor.', 'No pinned messages found in this channel.')}</div>
              ) : (
                <div className="space-y-3.5">
                  {pinnedMessages.map((msg) => (
                    <div key={msg.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar user={msg.sender} sizeClass="w-5 h-5 text-[9px]" />
                        <span className="text-xs font-bold text-white">{msg.sender.username}</span>
                        <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed truncate">{msg.content}</p>
                      <button 
                        id={`unpin-btn-${msg.id}`}
                        onClick={() => togglePinMessage(msg.id)} 
                        className="text-[10px] text-red-400 hover:underline font-semibold block"
                      >
                        {t('Sabitlemeyi Kaldır', 'Unpin message')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline channel messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            
            {/* Thread Welcome Starter info card */}
            <div className="space-y-2 p-6 rounded-2xl bg-white/5 border border-white/5 max-w-xl my-4">
              <div className="inline-flex p-3 rounded-full bg-indigo-600/10 text-indigo-400">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold font-display text-white mt-1">
                {t(`#${channelTitle} Kanalına Hoş Geldiniz!`, `Welcome to #${channelTitle}!`)}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('Bu kanalın başlangıç noktasıdır. Arkadaşlarınızla yazışabilir, kod paylaşabilir ve yapay zeka ile etkileşime girebilirsiniz.', 'This is the start of this channel timeline. Send attachments, write markdown snippets, or prompt GeminiAI!')}
              </p>
            </div>

            <div className="w-full h-[1px] bg-white/5 my-6" />

            {/* List timeline */}
            {channelMessages.length === 0 ? (
              <div className="text-center p-8 text-xs text-gray-500 italic">
                {t('Burada henüz mesaj yok. İlk mesajı siz yazın!', 'Empty timeline. Be the first to type!')}
              </div>
            ) : (
              <div className="space-y-4">
                {channelMessages.map((msg) => {
                  const isMe = msg.sender.id === currentUser.id;
                  const isPinned = msg.isPinned;

                  return (
                    <div 
                      key={msg.id} 
                      className={`group flex items-start gap-4 p-2.5 rounded-xl transition-all duration-150 relative hover:bg-white/5 border ${
                        msg.isBotResponse ? 'border-indigo-500/15 bg-indigo-500/5' : 'border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <Avatar user={msg.sender} sizeClass="w-10 h-10 text-sm" />

                      {/* Content block */}
                      <div className="flex-1 space-y-1 min-w-0">
                        
                        {/* Sender info */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white hover:underline cursor-pointer">
                            {msg.sender.username}
                          </span>
                          {msg.sender.id === 'bot-gemini' && (
                            <span className="text-[9px] bg-indigo-500 text-white font-extrabold px-1 py-0.2 rounded uppercase scale-90 flex items-center gap-0.5">
                              <Sparkles size={8} /> Bot
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* Pinned badge */}
                          {isPinned && (
                            <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                              <Pin size={8} /> {t('SABİTLENMİŞ', 'PINNED')}
                            </span>
                          )}
                        </div>

                        {/* Reply reference mapping if exists */}
                        {msg.replyTo && (
                          <div className="p-2 rounded-lg bg-black/25 border-l-2 border-indigo-500 text-[11px] text-indigo-300 max-w-lg mb-1 flex items-center gap-1.5">
                            <CornerUpLeft size={10} />
                            <span className="font-bold">{msg.replyTo.senderName}:</span>
                            <span className="truncate max-w-xs">{msg.replyTo.content}</span>
                          </div>
                        )}

                        {/* Dynamic Message Content Parser */}
                        <div className="text-gray-300 text-sm leading-relaxed">
                          {editingMessageId === msg.id ? (
                            <div className="space-y-2 mt-1">
                              <input
                                id={`edit-input-${msg.id}`}
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm focus:border-indigo-500 outline-none text-white"
                              />
                              <div className="flex gap-2 text-xs">
                                <button 
                                  id={`edit-save-${msg.id}`}
                                  onClick={() => {
                                    editMessage(msg.id, editText);
                                    setEditingMessageId(null);
                                  }}
                                  className="px-2 py-1 bg-green-600 rounded hover:bg-green-700 font-semibold"
                                >
                                  {t('Kaydet', 'Save')}
                                </button>
                                <button onClick={() => setEditingMessageId(null)} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10">
                                  {t('İptal', 'Cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            renderMessageContent(msg.content)
                          )}
                        </div>

                        {/* Attachments view */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 max-w-lg mt-2">
                            {msg.attachments.map((attach, atIdx) => (
                              <div key={atIdx} className="rounded-xl overflow-hidden border border-white/10 bg-black/25 relative group/attach">
                                {attach.type === 'image' ? (
                                  <img src={attach.url} alt="upload" className="max-h-48 object-cover w-full" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="p-4 flex items-center gap-3 text-xs text-indigo-300 font-mono">
                                    <Paperclip size={16} />
                                    <span className="truncate">{attach.name}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reactions rows */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {msg.reactions.map((react, reIdx) => (
                              <button
                                key={reIdx}
                                onClick={() => addReaction(msg.id, react.emoji)}
                                className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                                  react.users.includes(currentUser.id)
                                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                                    : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10 hover:text-white'
                                }`}
                              >
                                <span>{react.emoji}</span>
                                <span className="font-bold">{react.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                      </div>

                      {/* Hover actions panel overlay */}
                      {editingMessageId !== msg.id && (
                        <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 bg-[#111827] border border-white/10 px-1.5 py-1 rounded-xl shadow-xl z-10 scale-95 animate-scale-up">
                          <button
                            id={`react-heart-${msg.id}`}
                            onClick={() => addReaction(msg.id, '❤️')}
                            className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition"
                            title="Love"
                          >
                            ❤️
                          </button>
                          <button
                            id={`react-thumbs-${msg.id}`}
                            onClick={() => addReaction(msg.id, '👍')}
                            className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition"
                            title="Thumbs Up"
                          >
                            👍
                          </button>
                          <button
                            id={`react-laugh-${msg.id}`}
                            onClick={() => addReaction(msg.id, '😂')}
                            className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition"
                            title="Laugh"
                          >
                            😂
                          </button>
                          
                          <div className="w-[1px] h-4 bg-white/10 mx-1" />

                          <button
                            id={`action-reply-${msg.id}`}
                            onClick={() => setReplyMessageId(msg.id)}
                            className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition"
                            title={t('Cevapla', 'Reply')}
                          >
                            <CornerUpLeft size={12} />
                          </button>

                          <button
                            id={`action-pin-${msg.id}`}
                            onClick={() => togglePinMessage(msg.id)}
                            className="p-1 hover:bg-white/5 text-gray-400 hover:text-indigo-400 rounded transition"
                            title={t('Sabitle', 'Pin')}
                          >
                            <Pin size={12} />
                          </button>

                          {isMe && (
                            <>
                              <button
                                id={`action-edit-${msg.id}`}
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditText(msg.content);
                                }}
                                className="p-1 hover:bg-white/5 text-gray-400 hover:text-green-400 rounded transition"
                                title={t('Düzenle', 'Edit')}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                id={`action-delete-${msg.id}`}
                                onClick={() => deleteMessage(msg.id)}
                                className="p-1 hover:bg-white/5 text-gray-400 hover:text-red-400 rounded transition"
                                title={t('Sil', 'Delete')}
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom active typing indicators */}
          {typingList.length > 0 && (
            <div className="px-6 py-1.5 text-[11px] text-indigo-400 font-semibold bg-black/25 flex items-center gap-2 z-10 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
              {typingList.join(', ')} {typingList.length === 1 ? t('yazıyor...', 'is typing...') : t('yazıyorlar...', 'are typing...')}
            </div>
          )}

          {/* Attachment list previews above the input bar */}
          {attachments.length > 0 && (
            <div className="px-6 py-2.5 bg-black/10 border-t border-white/5 flex gap-3 flex-wrap shrink-0">
              {attachments.map((attach, atIdx) => (
                <div key={atIdx} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2.5 text-xs">
                  <Paperclip size={12} className="text-indigo-400" />
                  <span className="truncate max-w-[150px]">{attach.name}</span>
                  <button 
                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== atIdx))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Replying indicator above input bar */}
          {replyMessageId && (
            <div className="px-6 py-2 bg-indigo-600/10 border-t border-indigo-500/20 text-xs text-indigo-300 font-medium flex justify-between items-center shrink-0">
              <span className="flex items-center gap-1.5">
                <CornerUpLeft size={12} />
                {t('Cevaplanan mesaj:', 'Replying to')} @{rawChannelMessages.find(m => m.id === replyMessageId)?.sender.username}
              </span>
              <button onClick={() => setReplyMessageId(null)} className="text-gray-400 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}

          {/* 3. Bottom Chat Input Form Bar */}
          <form onSubmit={handleSendMessage} className="px-6 py-4 bg-black/10 border-t border-white/5 flex items-center gap-3 shrink-0 select-none z-10">
            
            {/* Custom Attachments file upload trigger */}
            <button
              id="chat-upload-trigger"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
              title={t('Dosya veya Görsel Ekle', 'Upload file/image')}
            >
              <Plus size={18} />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,.pdf,.doc,.docx,.zip,.txt" 
              />
            </button>

            {/* Main Text Area field */}
            <div className="flex-1 relative">
              <input
                id="chat-input-text"
                type="text"
                placeholder={
                  activeChannelId === 'ch-gemini-chat'
                    ? t('Gemini AI ile doğrudan konuşun...', 'Prompt Gemini AI directly here...')
                    : t(`#${channelTitle} kanalına mesaj gönder...`, `Send message to #${channelTitle}...`)
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none text-white transition pr-10"
              />
              
              {/* Emoji shortcut popover picker trigger button */}
              <button
                id="chat-emoji-trigger"
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-3 top-3 transition ${
                  showEmojiPicker ? 'text-yellow-500' : 'text-gray-400 hover:text-white'
                }`}
                title={t('Emoji Listesi', 'Emojis')}
              >
                <Smile size={20} />
              </button>

              {/* Emoji quick Picker popup */}
              {showEmojiPicker && (
                <div id="emoji-picker-popup" className="absolute bottom-14 right-0 bg-[#0c101c] border border-white/10 p-3 rounded-2xl shadow-2xl z-50 animate-scale-up w-64 space-y-3 text-xs">
                  <div>
                    <h5 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">{t('Hızlı Emojiler', 'Quick Emojis')}</h5>
                    <div className="grid grid-cols-6 gap-2 text-lg">
                      {['😀', '😂', '🔥', '🎉', '❤️', '👍', '🚀', '👀', '🎮', '💡', '😎', '💻'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInputText(inputText + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="hover:scale-125 transition duration-150 p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2">
                    <h5 className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-2">{t('Simüle Gaming GIF\'ler', 'Simulated Reaction GIFs')}</h5>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {[
                        { name: '🎉 Lobi Kutlaması', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=150' },
                        { name: '🔥 Gamer Mod', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=150' },
                      ].map((gif) => (
                        <button
                          key={gif.name}
                          type="button"
                          onClick={() => {
                            const gifAttachment: Attachment = {
                              name: gif.name,
                              type: 'image',
                              url: gif.url,
                            };
                            setAttachments([...attachments, gifAttachment]);
                            setShowEmojiPicker(false);
                          }}
                          className="p-1 rounded bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-left truncate transition flex flex-col gap-1 font-semibold"
                        >
                          <img src={gif.url} alt="gif" className="h-10 w-full object-cover rounded" />
                          <span className="truncate">{gif.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              id="chat-send-btn"
              type="submit"
              disabled={!inputText.trim() && attachments.length === 0}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white rounded-xl transition duration-200 shadow shadow-indigo-600/25 shrink-0"
              title={t('Gönder', 'Send')}
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
