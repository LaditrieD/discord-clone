import { create } from 'zustand';
import { User, Server, Channel, Message, VoiceState, SystemLog, UserSettings, Reaction } from '../types/chat';

interface ChatStore {
  // Current user
  currentUser: User;
  setCurrentUser: (user: Partial<User>) => void;
  userStatus: 'online' | 'idle' | 'dnd' | 'offline';
  setUserStatus: (status: 'online' | 'idle' | 'dnd' | 'offline') => void;

  // Servers & channels
  servers: Server[];
  activeServerId: string;
  activeChannelId: string;
  setActiveServerId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  addServer: (name: string, icon: string, isGroup?: boolean) => void;
  deleteServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<Server>) => void;
  addChannel: (serverId: string, categoryId: string, name: string, type: 'text' | 'voice') => void;
  deleteChannel: (serverId: string, categoryId: string, channelId: string) => void;

  // Users in database (all mock users + user)
  allUsers: User[];
  friends: string[]; // Friend user IDs
  blocked: string[]; // Blocked user IDs
  addFriend: (userId: string) => void;
  removeFriend: (userId: string) => void;
  toggleBlockUser: (userId: string) => void;

  // Server roles of users (userId -> ServerId -> roleId)
  userServerRoles: Record<string, Record<string, string>>;
  setUserServerRole: (userId: string, serverId: string, roleId: string) => void;

  // Messages grouped by channelId
  messages: Record<string, Message[]>;
  sendMessage: (content: string, replyToMessageId?: string, attachments?: any[]) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  togglePinMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;

  // Voice state
  voiceState: VoiceState;
  joinVoiceChannel: (channelId: string | null) => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;

  // Typing indicators
  typingUsers: Record<string, string[]>; // channelId -> list of usernames
  setTyping: (channelId: string, username: string, isTyping: boolean) => void;

  // Moderation / Ban / Kick / Timeout lists
  bannedUsers: Record<string, string[]>; // serverId -> list of userIds
  timeoutUsers: Record<string, Record<string, number>>; // serverId -> { userId -> timestamp }
  systemLogs: SystemLog[];
  addSystemLog: (serverId: string, type: SystemLog['type'], executor: string, target?: string, details?: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // Actions
  banUser: (serverId: string, userId: string, executor: string) => void;
  kickUser: (serverId: string, userId: string, executor: string) => void;
  timeoutUser: (serverId: string, userId: string, durationMinutes: number, executor: string) => void;
  removeTimeout: (serverId: string, userId: string) => void;
  unbanUser: (serverId: string, userId: string) => void;
}

// Pre-populated data for mock environment
const INITIAL_CURRENT_USER: User = {
  id: 'user-me',
  username: '',
  tag: Math.floor(1000 + Math.random() * 9000).toString(),
  avatar: '',
  banner: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
  about: '',
  customStatus: '',
  status: 'online',
  friends: [],
  blocked: [],
};

const MOCK_USERS: User[] = [
  {
    id: 'bot-gemini',
    username: 'GeminiAI',
    tag: '3500',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop',
    banner: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    about: 'Google Gemini tabanlı yapay zeka asistanı. @GeminiAI yazarak beni kanallarda etiketle!',
    customStatus: '',
    status: 'online',
    friends: [],
    blocked: [],
  },
  {
    id: 'user-1',
    username: 'Zeynep_Dev',
    tag: '0034',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    banner: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    about: 'React ve Tailwind CSS tutkunu frontend geliştirici.',
    customStatus: 'Kod yazıyor...',
    status: 'online',
    friends: ['user-me'],
    blocked: [],
  },
  {
    id: 'user-2',
    username: 'KozmikGezgin',
    tag: '1903',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    banner: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    about: 'Uzay ve astronomi hayranı, sunucu yöneticisi.',
    customStatus: 'Evreni izliyor 🌌',
    status: 'idle',
    friends: ['user-me'],
    blocked: [],
  },
  {
    id: 'user-3',
    username: 'Gamer35',
    tag: '0035',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop',
    banner: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    about: 'Rekabetçi FPS oyuncusu. Canım sıkkınsa DM atmayın.',
    customStatus: 'Valorant oynuyor 🎮',
    status: 'dnd',
    friends: ['user-me'],
    blocked: [],
  }
];

const INITIAL_SERVERS: Server[] = [];

const INITIAL_MESSAGES: Record<string, Message[]> = {};

const INITIAL_LOGS: SystemLog[] = [];

const safeLocalStorageSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Storage quota exceeded when saving ${key}. Trying to recover space...`, error);

    if (key === 'dc_current_user') {
      try {
        const user = JSON.parse(value);
        if (user.avatar && user.avatar.startsWith('data:') && user.avatar.length > 50000) {
          user.avatar = '';
        }
        if (user.banner && user.banner.startsWith('data:') && user.banner.length > 50000) {
          user.banner = '';
        }
        localStorage.setItem(key, JSON.stringify(user));
        return true;
      } catch (_) {}
    }

    if (key === 'dc_servers') {
      try {
        const parsedServers = JSON.parse(value);
        const pruned = parsedServers.map((s: any) => {
          if (s.logo && s.logo.startsWith('data:') && s.logo.length > 50000) {
            return { ...s, logo: '' };
          }
          return s;
        });
        localStorage.setItem(key, JSON.stringify(pruned));
        return true;
      } catch (_) {}
    }

    if (key !== 'dc_messages') {
      try {
        localStorage.removeItem('dc_messages');
        localStorage.setItem(key, value);
        return true;
      } catch (_) {}
    }

    try {
      const settings = localStorage.getItem('dc_settings');
      const user = localStorage.getItem('dc_current_user');
      localStorage.clear();
      if (settings) localStorage.setItem('dc_settings', settings);
      if (user) localStorage.setItem('dc_current_user', user);
      localStorage.setItem(key, value);
      return true;
    } catch (_) {}

    return false;
  }
};

const safeSaveMessages = (messages: Record<string, Message[]>): Record<string, Message[]> => {
  const success = safeLocalStorageSetItem('dc_messages', JSON.stringify(messages));
  if (success) {
    return messages;
  }

  console.warn('Storage quota exceeded for dc_messages, pruning...');
  
  // Pruning Level 1: Remove heavy base64 attachments from messages older than 2 messages in each channel
  const pruned1: Record<string, Message[]> = {};
  for (const [chId, msgs] of Object.entries(messages)) {
    pruned1[chId] = msgs.map((msg, idx) => {
      if (idx < msgs.length - 2 && msg.attachments && msg.attachments.length > 0) {
        return { ...msg, attachments: undefined, content: msg.content + ' (Görsel depolama sınırı nedeniyle silindi / Attachment removed due to storage quota)' };
      }
      return msg;
    });
  }

  if (safeLocalStorageSetItem('dc_messages', JSON.stringify(pruned1))) {
    return pruned1;
  }

  // Pruning Level 2: Keep only the last 15 messages for each channel and clear attachments
  const pruned2: Record<string, Message[]> = {};
  for (const [chId, msgs] of Object.entries(pruned1)) {
    pruned2[chId] = msgs.slice(-15).map(msg => ({ ...msg, attachments: undefined }));
  }
  
  if (safeLocalStorageSetItem('dc_messages', JSON.stringify(pruned2))) {
    return pruned2;
  }

  // Pruning Level 3: Keep only the last 3 messages for each channel
  const pruned3: Record<string, Message[]> = {};
  for (const [chId, msgs] of Object.entries(pruned2)) {
    pruned3[chId] = msgs.slice(-3);
  }
  
  if (safeLocalStorageSetItem('dc_messages', JSON.stringify(pruned3))) {
    return pruned3;
  }

  // Fallback: Clear entirely to recover
  console.error('Completely cleared messages storage due to critical storage limits.');
  try {
    localStorage.removeItem('dc_messages');
  } catch (_) {}
  return {};
};

export const useChatStore = create<ChatStore>((set, get) => {
  // Load initial states from localStorage if available, otherwise use default
  const savedUser = localStorage.getItem('dc_current_user');
  const savedServers = localStorage.getItem('dc_servers');
  const savedMessages = localStorage.getItem('dc_messages');
  const savedSettings = localStorage.getItem('dc_settings');
  const savedRoles = localStorage.getItem('dc_user_server_roles');

  const currentUser = savedUser ? JSON.parse(savedUser) : INITIAL_CURRENT_USER;
  const servers = savedServers ? JSON.parse(savedServers) : INITIAL_SERVERS;
  const messages = savedMessages ? JSON.parse(savedMessages) : INITIAL_MESSAGES;
  const settings: UserSettings = savedSettings ? JSON.parse(savedSettings) : {
    language: 'tr',
    theme: 'glass',
    notificationsEnabled: true,
    privacyShowStatus: true,
  };

  // Initial server roles (userId -> serverId -> roleId)
  // Owner role: 'owner', Admin: 'admin', Moderator: 'moderator', Member: 'member'
  const userServerRoles: Record<string, Record<string, string>> = savedRoles ? JSON.parse(savedRoles) : {
    'user-me': {}
  };

  return {
    currentUser,
    userStatus: currentUser.status,
    servers,
    activeServerId: servers[0]?.id || 'dm',
    activeChannelId: servers[0]?.id ? 'ch-genel' : 'all',

    allUsers: [currentUser, ...MOCK_USERS],
    friends: currentUser.friends,
    blocked: currentUser.blocked,

    userServerRoles,
    messages,

    voiceState: {
      currentChannelId: null,
      isMuted: false,
      isDeafened: false,
      isCameraOn: false,
      isScreenSharing: false,
    },

    typingUsers: {},

    bannedUsers: {},
    timeoutUsers: {},
    systemLogs: INITIAL_LOGS,
    settings,

    setCurrentUser: (userUpdates) => {
      const current = get().currentUser;
      const updated = { ...current, ...userUpdates };

      if (userUpdates.username !== undefined) {
        updated.username = userUpdates.username.trim();
      }

      // Ensure there's always a 4-digit tag (automatic numbers upon creation)
      if (!updated.tag) {
        updated.tag = Math.floor(1000 + Math.random() * 9000).toString();
      }

      safeLocalStorageSetItem('dc_current_user', JSON.stringify(updated));
      set((state) => ({
        currentUser: updated,
        allUsers: state.allUsers.map((u) => (u.id === 'user-me' ? updated : u)),
      }));
    },

    setUserStatus: (status) => {
      get().setCurrentUser({ status });
      set({ userStatus: status });
    },

    setActiveServerId: (id) => {
      const server = get().servers.find((s) => s.id === id);
      if (server) {
        // Find first text channel of the server
        let firstChannelId = '';
        for (const cat of server.categories) {
          const textCh = cat.channels.find((ch) => ch.type === 'text');
          if (textCh) {
            firstChannelId = textCh.id;
            break;
          }
        }
        set({ activeServerId: id, activeChannelId: firstChannelId });
      } else {
        set({ activeServerId: id, activeChannelId: '' });
      }
    },

    setActiveChannelId: (id) => {
      set({ activeChannelId: id });
    },

    addServer: (name, icon, isGroup) => {
      const newServer: Server & { isGroup?: boolean } = {
        id: `server-${Date.now()}`,
        name,
        icon: icon || name.substring(0, 2).toUpperCase(),
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
        ownerId: 'user-me',
        categories: [
          {
            id: `cat-${Date.now()}-1`,
            name: isGroup ? 'GRUP SOHBETİ' : 'YAZI KANALLARI',
            channels: [
              { id: `ch-${Date.now()}-genel`, name: isGroup ? 'sohbet-odası' : 'genel', type: 'text', topic: isGroup ? 'Grup sohbet odası' : 'Genel sohbet kanalı' }
            ]
          },
          {
            id: `cat-${Date.now()}-2`,
            name: 'SES KANALLARI',
            channels: [
              { id: `ch-${Date.now()}-ses`, name: isGroup ? 'Grup Sesli' : 'Lobi', type: 'voice' }
            ]
          }
        ]
      };

      const updatedServers = [...get().servers, newServer];
      safeLocalStorageSetItem('dc_servers', JSON.stringify(updatedServers));

      // Assign owner role to current user in this server
      const updatedRoles = { ...get().userServerRoles };
      if (!updatedRoles['user-me']) updatedRoles['user-me'] = {};
      updatedRoles['user-me'][newServer.id] = 'owner';
      safeLocalStorageSetItem('dc_user_server_roles', JSON.stringify(updatedRoles));

      set((state) => ({
        servers: updatedServers,
        activeServerId: newServer.id,
        activeChannelId: newServer.categories[0].channels[0].id,
        userServerRoles: updatedRoles,
      }));

      get().addSystemLog(newServer.id, 'CHANNEL_CREATE', 'KozmikGamer', undefined, `${name} sunucusu ve genel kanalları başarıyla oluşturuldu.`);
    },

    deleteServer: (id) => {
      const server = get().servers.find(s => s.id === id);
      if (!server) return;

      const updatedServers = get().servers.filter((s) => s.id !== id);
      safeLocalStorageSetItem('dc_servers', JSON.stringify(updatedServers));

      const nextActiveServer = updatedServers[0]?.id || 'dm';
      set({ servers: updatedServers });
      get().setActiveServerId(nextActiveServer);
    },

    updateServer: (id, updates) => {
      const updatedServers = get().servers.map((s) => {
        if (s.id === id) {
          return { ...s, ...updates };
        }
        return s;
      });
      safeLocalStorageSetItem('dc_servers', JSON.stringify(updatedServers));
      set({ servers: updatedServers });
    },

    addChannel: (serverId, categoryId, name, type) => {
      const cleanName = name.toLowerCase().replace(/\s+/g, '-');
      const newChannel: Channel = {
        id: `ch-${Date.now()}`,
        name: type === 'text' ? cleanName : name,
        type,
        topic: type === 'text' ? 'Hoş geldiniz! Sohbet etmeye başlayabilirsiniz.' : undefined
      };

      const updatedServers = get().servers.map((s) => {
        if (s.id === serverId) {
          const updatedCategories = s.categories.map((cat) => {
            if (cat.id === categoryId) {
              return { ...cat, channels: [...cat.channels, newChannel] };
            }
            return cat;
          });
          return { ...s, categories: updatedCategories };
        }
        return s;
      });

      safeLocalStorageSetItem('dc_servers', JSON.stringify(updatedServers));
      set({ servers: updatedServers, activeChannelId: newChannel.id });

      get().addSystemLog(serverId, 'CHANNEL_CREATE', get().currentUser.username, undefined, `#${newChannel.name} kanalı oluşturuldu.`);
    },

    deleteChannel: (serverId, categoryId, channelId) => {
      const updatedServers = get().servers.map((s) => {
        if (s.id === serverId) {
          const updatedCategories = s.categories.map((cat) => {
            if (cat.id === categoryId) {
              return { ...cat, channels: cat.channels.filter((ch) => ch.id !== channelId) };
            }
            return cat;
          });
          return { ...s, categories: updatedCategories };
        }
        return s;
      });

      safeLocalStorageSetItem('dc_servers', JSON.stringify(updatedServers));

      // Switch active channel if we deleted the current one
      let firstAvailableChId = '';
      const server = updatedServers.find(s => s.id === serverId);
      if (server) {
        for (const cat of server.categories) {
          const textCh = cat.channels.find(ch => ch.type === 'text');
          if (textCh) {
            firstAvailableChId = textCh.id;
            break;
          }
        }
      }

      set({
        servers: updatedServers,
        activeChannelId: get().activeChannelId === channelId ? firstAvailableChId : get().activeChannelId
      });

      get().addSystemLog(serverId, 'CHANNEL_DELETE', get().currentUser.username, undefined, `Bir kanal silindi.`);
    },

    addFriend: (userId) => {
      const user = get().allUsers.find(u => u.id === userId);
      if (!user) return;
      if (get().friends.includes(userId)) return;

      const updatedFriends = [...get().friends, userId];
      get().setCurrentUser({ friends: updatedFriends });
      set({ friends: updatedFriends });
    },

    removeFriend: (userId) => {
      const updatedFriends = get().friends.filter(id => id !== userId);
      get().setCurrentUser({ friends: updatedFriends });
      set({ friends: updatedFriends });
    },

    toggleBlockUser: (userId) => {
      const isBlocked = get().blocked.includes(userId);
      const updatedBlocked = isBlocked 
        ? get().blocked.filter(id => id !== userId)
        : [...get().blocked, userId];

      get().setCurrentUser({ blocked: updatedBlocked });
      set({ blocked: updatedBlocked });
    },

    setUserServerRole: (userId, serverId, roleId) => {
      const updatedRoles = { ...get().userServerRoles };
      if (!updatedRoles[userId]) updatedRoles[userId] = {};
      updatedRoles[userId][serverId] = roleId;

      safeLocalStorageSetItem('dc_user_server_roles', JSON.stringify(updatedRoles));
      set({ userServerRoles: updatedRoles });

      const user = get().allUsers.find(u => u.id === userId);
      get().addSystemLog(serverId, 'ROLE_UPDATE', get().currentUser.username, user?.username, `Rol ${roleId.toUpperCase()} olarak güncellendi.`);
    },

    sendMessage: async (content, replyToMessageId, attachments) => {
      const activeChId = get().activeChannelId;
      const activeServId = get().activeServerId;
      if (!activeChId) return;

      let replyToData = undefined;
      if (replyToMessageId) {
        const channelMsgs = get().messages[activeChId] || [];
        const replyMsg = channelMsgs.find(m => m.id === replyToMessageId);
        if (replyMsg) {
          replyToData = {
            id: replyMsg.id,
            senderName: replyMsg.sender.username,
            content: replyMsg.content,
          };
        }
      }

      const newMessage: Message = {
        id: `m-${Date.now()}`,
        serverId: activeServId,
        channelId: activeChId,
        sender: get().currentUser,
        content,
        timestamp: new Date().toISOString(),
        replyTo: replyToData,
        attachments,
      };

      const updatedChannelMsgs = [...(get().messages[activeChId] || []), newMessage];
      const updatedMessages = { ...get().messages, [activeChId]: updatedChannelMsgs };

      const storedMessages = safeSaveMessages(updatedMessages);
      set({ messages: storedMessages });

      // Trigger active simulations or chatbot!
      const containsMention = content.includes('@GeminiAI');
      const isGeminiChannel = activeChId === 'ch-gemini-chat';

      if (containsMention || isGeminiChannel) {
        // Chatbot triggers typing
        get().setTyping(activeChId, 'GeminiAI', true);

        // Make call to server API `/api/bot`
        try {
          const chatHistory = updatedChannelMsgs.slice(-10).map(msg => ({
            sender: msg.sender.username,
            content: msg.content,
            isBot: msg.sender.id === 'bot-gemini',
          }));

          const response = await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: content.replace('@GeminiAI', '').trim(),
              history: chatHistory,
              channelName: isGeminiChannel ? 'gemini-sohbet' : 'genel',
            }),
          });

          const data = await response.json();
          get().setTyping(activeChId, 'GeminiAI', false);

          const botMessage: Message = {
            id: `m-bot-${Date.now()}`,
            serverId: activeServId,
            channelId: activeChId,
            sender: MOCK_USERS[3], // GeminiAI
            content: data.reply || 'Cihaz bağlantısı kurulamadı veya bir hata oluştu. Ancak yapay zeka asistanınız her zaman kalbinizde!',
            timestamp: new Date().toISOString(),
            isBotResponse: true,
          };

          const doubleUpdatedMsgs = [...(get().messages[activeChId] || []), botMessage];
          const doubleUpdatedMessages = { ...get().messages, [activeChId]: doubleUpdatedMsgs };
          const storedMessages = safeSaveMessages(doubleUpdatedMessages);
          set({ messages: storedMessages });
        } catch (err) {
          get().setTyping(activeChId, 'GeminiAI', false);
          // Simulated cute response in case API is down or Key is missing
          setTimeout(() => {
            const botMessage: Message = {
              id: `m-bot-${Date.now()}`,
              serverId: activeServId,
              channelId: activeChId,
              sender: MOCK_USERS[3],
              content: `Sohbet ettiğimiz için çok mutluyum! 😊 \n\nŞu anda yerel modda çalışıyorum çünkü Gemini API Anahtarı henüz girilmemiş olabilir. Ama şunları yapabilirim:\n- Harika bir Discord arayüzü sunmak\n- Sunucu kurup, kategoriler ve kanallar yönetmene izin vermek\n- Mikrofon/Kamera/Ekran paylaşımı simüle etmek\n- Sunucudaki diğer üyeleri banlayıp susturmana yardım etmek!\n\nSenin için ne yapmamı istersin?`,
              timestamp: new Date().toISOString(),
              isBotResponse: true,
            };
            const fallbackMessages = { ...get().messages, [activeChId]: [...(get().messages[activeChId] || []), botMessage] };
            const storedMessages = safeSaveMessages(fallbackMessages);
            set({ messages: storedMessages });
          }, 1000);
        }
      } else {
        // Simulation of other users responding on non-AI channels
        // 30% chance another member replies after 2-3 seconds to keep it alive
        const rand = Math.random();
        if (rand < 0.4 && activeChId !== 'ch-rules') {
          const mockResponders = MOCK_USERS.filter(u => u.id !== 'bot-gemini');
          const randomUser = mockResponders[Math.floor(Math.random() * mockResponders.length)];

          setTimeout(() => {
            get().setTyping(activeChId, randomUser.username, true);
          }, 800);

          setTimeout(() => {
            get().setTyping(activeChId, randomUser.username, false);

            const replies = [
              "Bu harika bir fikir! Kesinlikle katılıyorum 👍",
              "Bunun üzerinde çalışıyordum ben de, tam üstüne bastın.",
              "Bugün çok yoğun geçiyor ya, akşam oyun girince anca rahatlarım.",
              "Gerçekten premium bir tasarım olmuş, Discord'dan daha akıcı sanki!",
              "Ahaha çok iyiydi bu 😂",
              "Bunu yeni denerken karşılaştım, muazzam iş çıkartmışlar.",
              "Ses kanalına geçelim mi birazdan sohbet ederiz hem.",
              "Şu an kodlamayla uğraşıyorum, CSS dertlerim biterse geleceğim."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];

            const simMessage: Message = {
              id: `m-sim-${Date.now()}`,
              serverId: activeServId,
              channelId: activeChId,
              sender: randomUser,
              content: randomReply,
              timestamp: new Date().toISOString(),
            };

            const simUpdated = { ...get().messages, [activeChId]: [...(get().messages[activeChId] || []), simMessage] };
            const storedMessages = safeSaveMessages(simUpdated);
            set({ messages: storedMessages });
          }, 2200);
        }
      }
    },

    editMessage: (messageId, newContent) => {
      const activeChId = get().activeChannelId;
      if (!activeChId) return;

      const updatedMsgs = (get().messages[activeChId] || []).map((m) => {
        if (m.id === messageId) {
          return { ...m, content: newContent, edited: true };
        }
        return m;
      });

      const updatedMessages = { ...get().messages, [activeChId]: updatedMsgs };
      const storedMessages = safeSaveMessages(updatedMessages);
      set({ messages: storedMessages });
    },

    deleteMessage: (messageId) => {
      const activeChId = get().activeChannelId;
      if (!activeChId) return;

      const updatedMsgs = (get().messages[activeChId] || []).filter((m) => m.id !== messageId);
      const updatedMessages = { ...get().messages, [activeChId]: updatedMsgs };
      const storedMessages = safeSaveMessages(updatedMessages);
      set({ messages: storedMessages });

      get().addSystemLog(get().activeServerId, 'MESSAGE_DELETE', get().currentUser.username, undefined, `Kullanıcı kendi veya bir başkasının mesajını sildi.`);
    },

    togglePinMessage: (messageId) => {
      const activeChId = get().activeChannelId;
      if (!activeChId) return;

      const updatedMsgs = (get().messages[activeChId] || []).map((m) => {
        if (m.id === messageId) {
          return { ...m, isPinned: !m.isPinned };
        }
        return m;
      });

      const updatedMessages = { ...get().messages, [activeChId]: updatedMsgs };
      const storedMessages = safeSaveMessages(updatedMessages);
      set({ messages: storedMessages });
    },

    addReaction: (messageId, emoji) => {
      const activeChId = get().activeChannelId;
      const meId = get().currentUser.id;
      if (!activeChId) return;

      const updatedMsgs = (get().messages[activeChId] || []).map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions ? [...m.reactions] : [];
          const existingReaction = reactions.find(r => r.emoji === emoji);

          if (existingReaction) {
            const hasUserReacted = existingReaction.users.includes(meId);
            if (hasUserReacted) {
              // Remove reaction
              const updatedUsers = existingReaction.users.filter(u => u !== meId);
              if (updatedUsers.length === 0) {
                return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) };
              }
              return {
                ...m,
                reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, users: updatedUsers } : r)
              };
            } else {
              // Add user to reaction
              return {
                ...m,
                reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, meId] } : r)
              };
            }
          } else {
            // Create new reaction
            reactions.push({ emoji, count: 1, users: [meId] });
            return { ...m, reactions };
          }
        }
        return m;
      });

      const updatedMessages = { ...get().messages, [activeChId]: updatedMsgs };
      const storedMessages = safeSaveMessages(updatedMessages);
      set({ messages: storedMessages });
    },

    joinVoiceChannel: (channelId) => {
      set((state) => ({
        voiceState: {
          ...state.voiceState,
          currentChannelId: channelId,
          isScreenSharing: channelId ? state.voiceState.isScreenSharing : false,
          isCameraOn: channelId ? state.voiceState.isCameraOn : false
        }
      }));
    },

    toggleMute: () => {
      set((state) => ({
        voiceState: { ...state.voiceState, isMuted: !state.voiceState.isMuted }
      }));
    },

    toggleDeafen: () => {
      set((state) => ({
        voiceState: { 
          ...state.voiceState, 
          isDeafened: !state.voiceState.isDeafened,
          // Deafen automatically mutes too, typical Discord behavior
          isMuted: !state.voiceState.isDeafened ? true : state.voiceState.isMuted
        }
      }));
    },

    toggleCamera: () => {
      set((state) => ({
        voiceState: { ...state.voiceState, isCameraOn: !state.voiceState.isCameraOn }
      }));
    },

    toggleScreenShare: () => {
      set((state) => ({
        voiceState: { ...state.voiceState, isScreenSharing: !state.voiceState.isScreenSharing }
      }));
    },

    setTyping: (channelId, username, isTyping) => {
      set((state) => {
        const currentList = state.typingUsers[channelId] || [];
        const updatedList = isTyping
          ? currentList.includes(username) ? currentList : [...currentList, username]
          : currentList.filter(u => u !== username);

        return {
          typingUsers: { ...state.typingUsers, [channelId]: updatedList }
        };
      });
    },

    addSystemLog: (serverId, type, executor, target, details) => {
      const newLog: SystemLog = {
        id: `log-${Date.now()}`,
        serverId,
        type,
        timestamp: new Date().toISOString(),
        executor,
        target,
        details: details || `${executor}, ${target || ''} üzerinde ${type} işlemi gerçekleştirdi.`
      };
      set((state) => ({ systemLogs: [newLog, ...state.systemLogs] }));
    },

    updateSettings: (settingUpdates) => {
      const updated = { ...get().settings, ...settingUpdates };
      safeLocalStorageSetItem('dc_settings', JSON.stringify(updated));
      set({ settings: updated });
    },

    banUser: (serverId, userId, executor) => {
      const user = get().allUsers.find(u => u.id === userId);
      const bannedList = get().bannedUsers[serverId] || [];
      
      set((state) => ({
        bannedUsers: {
          ...state.bannedUsers,
          [serverId]: [...bannedList, userId]
        }
      }));

      get().addSystemLog(serverId, 'BAN', executor, user?.username, `${user?.username} sunucudan kalıcı olarak yasaklandı.`);
    },

    kickUser: (serverId, userId, executor) => {
      const user = get().allUsers.find(u => u.id === userId);
      get().addSystemLog(serverId, 'KICK', executor, user?.username, `${user?.username} sunucudan atıldı (kick).`);
    },

    timeoutUser: (serverId, userId, durationMinutes, executor) => {
      const user = get().allUsers.find(u => u.id === userId);
      const untilTimestamp = Date.now() + durationMinutes * 60 * 1000;

      set((state) => ({
        timeoutUsers: {
          ...state.timeoutUsers,
          [serverId]: {
            ...(state.timeoutUsers[serverId] || {}),
            [userId]: untilTimestamp
          }
        }
      }));

      get().addSystemLog(serverId, 'TIMEOUT', executor, user?.username, `${user?.username} adlı kullanıcıya ${durationMinutes} dakika susturma cezası verildi.`);
    },

    removeTimeout: (serverId, userId) => {
      const user = get().allUsers.find(u => u.id === userId);
      const serverTimeouts = { ...(get().timeoutUsers[serverId] || {}) };
      delete serverTimeouts[userId];

      set((state) => ({
        timeoutUsers: {
          ...state.timeoutUsers,
          [serverId]: serverTimeouts
        }
      }));

      get().addSystemLog(serverId, 'ROLE_UPDATE', 'Yönetim', user?.username, `${user?.username} kullanıcısının susturma cezası kaldırıldı.`);
    },

    unbanUser: (serverId, userId) => {
      const user = get().allUsers.find(u => u.id === userId);
      const bannedList = get().bannedUsers[serverId] || [];

      set((state) => ({
        bannedUsers: {
          ...state.bannedUsers,
          [serverId]: bannedList.filter(id => id !== userId)
        }
      }));

      get().addSystemLog(serverId, 'ROLE_UPDATE', 'Yönetim', user?.username, `${user?.username} kullanıcısının yasağı kaldırıldı.`);
    }
  };
});
