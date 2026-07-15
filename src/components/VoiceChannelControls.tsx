import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  Video, VideoOff, Monitor, PhoneOff, Mic, MicOff, Headphones, 
  Volume2, Settings, Users, Radio, AlertCircle, Maximize2 
} from 'lucide-react';

export default function VoiceChannelControls() {
  const { 
    servers, 
    activeServerId, 
    voiceState, 
    joinVoiceChannel, 
    toggleMute, 
    toggleDeafen, 
    toggleCamera, 
    toggleScreenShare,
    allUsers,
    settings 
  } = useChatStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>(['user-1']); // Zeynep_Dev is speaking initially
  const [volumes, setVolumes] = useState<Record<string, number>>({
    'user-me': 100,
    'user-1': 120,
    'user-2': 100,
    'user-3': 150
  });

  // Translation helper
  const t = (tr: string, en: string) => settings.language === 'tr' ? tr : en;

  // Simulate active speaking loop to make the room feel real and alive
  useEffect(() => {
    const interval = setInterval(() => {
      const candidates = ['user-1', 'user-2', 'user-3', 'user-me'];
      const randomSpeakers = candidates.filter(() => Math.random() > 0.45);
      setActiveSpeakers(randomSpeakers);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Web camera activation if camera is toggled
  useEffect(() => {
    async function startCamera() {
      if (voiceState.isCameraOn) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 400, height: 300 }, 
            audio: false 
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.warn("Camera permission not granted or webcam not available. Using visual fallback.", err);
        }
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [voiceState.isCameraOn]);

  const currentChannel = servers
    .flatMap(s => s.categories.flatMap(c => c.channels))
    .find(c => c.id === voiceState.currentChannelId);

  if (!voiceState.currentChannelId) return null;

  // Render list of mock voice users safely by searching IDs
  const currentUserObj = allUsers.find(u => u.id === 'user-me') || allUsers[0];
  const zeynepObj = allUsers.find(u => u.id === 'user-1');
  const kozmikObj = allUsers.find(u => u.id === 'user-2');
  const gamerObj = allUsers.find(u => u.id === 'user-3');

  const callParticipants = [
    { id: 'user-me', name: currentUserObj?.username || 'KozmikGamer', avatar: currentUserObj?.avatar, isMuted: voiceState.isMuted, hasVideo: voiceState.isCameraOn },
    { id: 'user-1', name: zeynepObj?.username || 'Zeynep_Dev', avatar: zeynepObj?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', isMuted: false, hasVideo: true },
    { id: 'user-2', name: kozmikObj?.username || 'KozmikGezgin', avatar: kozmikObj?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop', isMuted: true, hasVideo: false },
    { id: 'user-3', name: gamerObj?.username || 'Gamer35', avatar: gamerObj?.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop', isMuted: false, hasVideo: false }
  ];

  return (
    <div id="voice-controls-panel" className="flex-1 glass-panel m-4 rounded-2xl flex flex-col justify-between overflow-hidden relative">
      
      {/* Top status bar */}
      <div className="bg-black/30 px-6 py-4 border-b border-white/5 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
              <Radio size={16} className="text-indigo-400" />
              {currentChannel?.name || 'Sanal Lobi'}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t('RTC Ses Bağlantısı • 96kbps Yüksek Kalite', 'RTC Voice Stream • 96kbps Ultra HQ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
            <Users size={12} />
            {callParticipants.length} {t('Katılımcı', 'Connected')}
          </span>
        </div>
      </div>

      {/* Main grids of participants */}
      <div className="flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto min-h-0">
        
        {/* Large screen sharing preview (renders if active) */}
        {voiceState.isScreenSharing ? (
          <div className="w-full max-w-4xl aspect-video rounded-xl bg-slate-900 border border-indigo-500/30 overflow-hidden relative shadow-2xl flex flex-col justify-between p-4 mb-6 animate-scale-up">
            
            {/* Animated space background art simulator */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-950 flex flex-col justify-center items-center overflow-hidden">
              <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 filter blur-[80px] animate-pulse-slow" />
              <div className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/5 filter blur-[60px]" />
              
              {/* Floating server nodes vectors */}
              <div className="text-center space-y-4 z-10">
                <div className="inline-flex p-3 rounded-full bg-indigo-600/20 text-indigo-400 animate-bounce">
                  <Monitor size={48} />
                </div>
                <h4 className="text-lg font-bold font-display text-white tracking-wide">
                  {t('Ekran Paylaşımı Önizlemesi', 'Live Desktop Screen Share')}
                </h4>
                <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">
                  {t('KozmikGamer ekranını aktarıyor • 1080p @ 60 FPS', 'KozmikGamer broadcasting screen • 1080p @ 60 FPS')}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start z-10 w-full">
              <span className="bg-indigo-600/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                {t('CANLI YAYIN', 'BROADCASTING')}
              </span>
              <button 
                id="voice-screenshare-fullscreen"
                className="p-1.5 bg-black/60 hover:bg-black/80 rounded text-gray-300 transition"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Dynamic call members grids */}
        <div className={`grid gap-4 w-full max-w-4xl ${voiceState.isScreenSharing ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
          {callParticipants.map((p) => {
            const isSpeaking = activeSpeakers.includes(p.id);
            const isMe = p.id === 'user-me';

            return (
              <div 
                key={p.id} 
                className={`aspect-video rounded-xl border relative flex flex-col justify-between p-3.5 overflow-hidden transition-all duration-300 ${
                  isSpeaking 
                    ? 'border-green-500 bg-green-500/5 shadow-lg shadow-green-500/5 ring-2 ring-green-500/50' 
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Background visual avatar / Camera Stream */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 z-0">
                  {isMe && voiceState.isCameraOn && stream ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : p.hasVideo && p.id === 'user-1' ? (
                    // Mock Zeynep's webcam stream with a cool tech GIF/loop unspash video banner
                    <img 
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop" 
                      alt="video" 
                      className="w-full h-full object-cover filter brightness-75 rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="relative inline-block">
                        <img 
                          src={p.avatar} 
                          alt={p.name} 
                          className={`w-14 h-14 rounded-full object-cover border-2 ${
                            isSpeaking ? 'border-green-400 scale-110' : 'border-indigo-500/40'
                          } transition-all duration-300`} 
                        />
                        {isSpeaking && (
                          <div className="absolute -inset-1 rounded-full border border-green-400 animate-ping pointer-events-none" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Speaker indicator badge */}
                <div className="flex justify-between items-start z-10 w-full">
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold text-gray-300">
                    {p.name}
                  </span>
                  {p.isMuted && (
                    <span className="p-1 bg-red-600 text-white rounded-full scale-90">
                      <MicOff size={10} />
                    </span>
                  )}
                </div>

                {/* Bottom indicators and Volume Slider */}
                <div className="flex flex-col gap-1.5 z-10 w-full mt-auto">
                  <div className="flex justify-between items-end">
                    {p.hasVideo ? (
                      <span className="bg-green-600/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                        {t('Kamera Açık', 'CAMERA ON')}
                      </span>
                    ) : (
                      <span />
                    )}
                    {isSpeaking && (
                      <span className="text-[10px] text-green-400 font-bold bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Volume2 size={10} /> {t('Konuşuyor', 'Speaking')}
                      </span>
                    )}
                  </div>

                  {/* Individual volume adjustment slider (0 - 200) */}
                  <div className="flex items-center justify-between gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setVolumes({...volumes, [p.id]: volumes[p.id] === 0 ? 100 : 0})}
                      className="text-gray-300 hover:text-white transition shrink-0"
                    >
                      {volumes[p.id] === 0 ? <Volume2 size={12} className="text-red-400" /> : <Volume2 size={12} className="text-indigo-400" />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="200"
                      value={volumes[p.id]}
                      onChange={(e) => setVolumes({...volumes, [p.id]: parseInt(e.target.value)})}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[9px] font-bold text-indigo-300 font-mono w-7 text-right">
                      {volumes[p.id]}%
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Control panel dashboard dock at the bottom */}
      <div className="bg-black/45 backdrop-blur-md px-8 py-5 border-t border-white/5 flex justify-between items-center z-10">
        
        {/* Left indicators */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              {t('Yayın Akışı', 'Connection Quality')}
            </span>
            <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t('Gecikme Yok (12ms)', 'Excellent Latency (12ms)')}
            </span>
          </div>
        </div>

        {/* Center control keys */}
        <div className="flex items-center gap-3">
          <button
            id="voice-control-mute"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              voiceState.isMuted 
                ? 'bg-red-600 text-white' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
            title={voiceState.isMuted ? t('Mikrofonu Aç', 'Unmute Mic') : t('Mikrofonu Kapat', 'Mute Mic')}
          >
            {voiceState.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            id="voice-control-deafen"
            onClick={toggleDeafen}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${
              voiceState.isDeafened 
                ? 'bg-red-600 text-white' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
            title={voiceState.isDeafened ? t('Kulaklığı Aç', 'Undeafen') : t('Kulaklığı Kapat', 'Deafen')}
          >
            <Headphones size={20} className={voiceState.isDeafened ? 'opacity-50' : ''} />
            {voiceState.isDeafened && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-0.5 bg-white rotate-45 transform origin-center rounded" />
              </div>
            )}
          </button>

          <button
            id="voice-control-cam"
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              voiceState.isCameraOn 
                ? 'bg-green-600 text-white animate-pulse-slow' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
            title={voiceState.isCameraOn ? t('Kamerayı Kapat', 'Camera Off') : t('Kamerayı Aç', 'Camera On')}
          >
            {voiceState.isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            id="voice-control-screenshare"
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              voiceState.isScreenSharing 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
            title={voiceState.isScreenSharing ? t('Yayını Kapat', 'Stop Screen Share') : t('Ekran Paylaş', 'Share Screen')}
          >
            <Monitor size={20} />
          </button>
        </div>

        {/* Right disconnect button */}
        <div>
          <button
            id="voice-control-disconnect"
            onClick={() => joinVoiceChannel(null)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition duration-200 shadow-lg shadow-red-600/20"
          >
            <PhoneOff size={16} />
            {t('Bağlantıyı Kes', 'Disconnect')}
          </button>
        </div>

      </div>

    </div>
  );
}
