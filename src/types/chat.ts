export interface User {
  id: string;
  username: string;
  tag: string;
  avatar: string; // Base64 or placeholder URL
  banner: string; // Base64 or color gradient
  about: string;
  customStatus: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  friends: string[]; // List of user IDs
  blocked: string[]; // List of user IDs
  email?: string;
  phoneNumber?: string;
}

export type RoleType = 'owner' | 'admin' | 'moderator' | 'member';

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: {
    admin: boolean;
    manageChannels: boolean;
    kickMembers: boolean;
    banMembers: boolean;
    timeoutMembers: boolean;
    sendMessages: boolean;
  };
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  icon: string; // Base64 or abbreviation
  banner: string;
  ownerId: string;
  categories: Category[];
  roles?: Role[];
}

export interface Attachment {
  name: string;
  type: 'image' | 'file';
  url: string; // Base64 or object URL
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // User IDs who added reaction
}

export interface Message {
  id: string;
  serverId: string;
  channelId: string;
  sender: User;
  content: string;
  timestamp: string;
  isPinned?: boolean;
  edited?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  attachments?: Attachment[];
  reactions?: Reaction[];
  isBotResponse?: boolean;
}

export interface VoiceState {
  currentChannelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export interface SystemLog {
  id: string;
  serverId: string;
  type: 'BAN' | 'KICK' | 'TIMEOUT' | 'ROLE_UPDATE' | 'CHANNEL_CREATE' | 'CHANNEL_DELETE' | 'MESSAGE_DELETE' | 'MEMBER_JOIN';
  timestamp: string;
  executor: string;
  target?: string;
  details: string;
}

export interface UserSettings {
  language: 'tr' | 'en';
  theme: 'dark' | 'glass';
  notificationsEnabled: boolean;
  privacyShowStatus: boolean;
}
