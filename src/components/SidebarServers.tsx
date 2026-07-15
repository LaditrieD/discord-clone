import { useChatStore } from '../store/chatStore';
import { Plus, MessageSquare, Compass, Settings, ShieldAlert, LogOut, UserCheck } from 'lucide-react';

interface SidebarServersProps {
  onOpenSettings: () => void;
  onOpenFriends: () => void;
  onOpenAddServer: () => void;
}

export default function SidebarServers({ onOpenSettings, onOpenFriends, onOpenAddServer }: SidebarServersProps) {
  const { servers, activeServerId, setActiveServerId, settings } = useChatStore();

  const handleServerClick = (id: string) => {
    setActiveServerId(id);
  };

  const isDmActive = activeServerId === 'dm';
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  return (
    <div id="sidebar-servers" className="w-[72px] bg-white/[0.01] backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between items-center py-4 shrink-0 z-10 select-none">
      
      {/* Top action icons and Server list */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* DM Launcher button */}
        <div className="relative group flex items-center justify-center w-full">
          <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 ${
            isDmActive ? 'h-10' : 'h-0 group-hover:h-5'
          }`} />
          <button
            id="server-btn-dm"
            onClick={() => setActiveServerId('dm')}
            className={`w-12 h-12 rounded-3xl flex items-center justify-center transition-all duration-300 relative border border-white/5 ${
              isDmActive 
                ? 'bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white/[0.03] hover:bg-indigo-600 hover:border-indigo-500/30 hover:rounded-xl text-gray-300 hover:text-white'
            }`}
          >
            <MessageSquare size={22} />
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-[80px] bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/5">
            {t('Doğrudan Mesajlar & Arkadaşlar', 'Direct Messages & Friends')}
          </div>
        </div>

        <div className="w-8 h-[2px] bg-white/10 rounded my-1" />

        {/* Server list scrollable container */}
        <div className="flex flex-col items-center gap-2.5 w-full overflow-y-auto max-h-[420px] no-scrollbar">
          {servers.map((server) => {
            const isActive = activeServerId === server.id;
            const initials = server.icon;

            return (
              <div key={server.id} className="relative group flex items-center justify-center w-full">
                {/* Active side pill */}
                <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 ${
                  isActive ? 'h-10' : 'h-0 group-hover:h-5'
                }`} />

                <button
                  id={`server-btn-${server.id}`}
                  onClick={() => handleServerClick(server.id)}
                  className={`w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-sm transition-all duration-300 border border-white/5 overflow-hidden ${
                    isActive 
                      ? 'bg-indigo-600 rounded-xl text-white shadow-indigo-500/30 shadow-lg border-indigo-500/30' 
                      : 'bg-white/[0.03] hover:bg-indigo-600 hover:border-indigo-500/30 hover:rounded-xl text-indigo-400 hover:text-white'
                  }`}
                >
                  {server.icon && (server.icon.startsWith('data:image') || server.icon.startsWith('http') || server.icon.length > 3) ? (
                    <img 
                      src={server.icon} 
                      alt={server.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : server.banner && server.icon.length === 2 ? (
                    <div className="w-full h-full rounded-inherit flex items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-600 font-display">
                      {initials}
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-inherit flex items-center justify-center bg-gradient-to-tr from-gray-800 to-indigo-900 font-display">
                      {initials}
                    </div>
                  )}
                </button>

                {/* Tooltip */}
                <div className="absolute left-[80px] bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/5">
                  {server.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full mt-1">
          <button
            id="server-btn-add"
            onClick={onOpenAddServer}
            className="w-12 h-12 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-green-600 hover:border-green-500/30 hover:rounded-xl flex items-center justify-center text-green-500 hover:text-white transition-all duration-300"
          >
            <Plus size={22} />
          </button>
          {/* Tooltip */}
          <div className="absolute left-[80px] bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/5">
            {t('Sunucu Ekle', 'Add a Server')}
          </div>
        </div>
      </div>

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-3 w-full">
        
        {/* Friends Shortcut Button */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            id="server-btn-friends"
            onClick={onOpenFriends}
            className="w-11 h-11 rounded-full bg-white/5 hover:bg-indigo-600/30 flex items-center justify-center text-gray-300 hover:text-indigo-400 transition-all duration-200"
          >
            <UserCheck size={18} />
          </button>
          <div className="absolute left-[80px] bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/5">
            {t('Arkadaşlar Panelini Aç', 'Open Friends Panel')}
          </div>
        </div>

        {/* Settings button */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            id="server-btn-settings"
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-full bg-white/5 hover:bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
          >
            <Settings size={18} />
          </button>
          <div className="absolute left-[80px] bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/5">
            {t('Uygulama Ayarları', 'App Settings')}
          </div>
        </div>

      </div>
    </div>
  );
}
