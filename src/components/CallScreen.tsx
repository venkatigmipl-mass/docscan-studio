import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Video, 
  VideoOff, 
  SwitchCamera, 
  Sparkles, 
  ShieldAlert,
  Smile
} from 'lucide-react';
import { CallSession, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';
import { SoundEffects } from '../services/soundEffects';

interface CallScreenProps {
  session: CallSession;
  language: AppLanguage;
  onEndCall: (durationSeconds: number) => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  session,
  language,
  onEndCall
}) => {
  const t = getT(language);
  const [status, setStatus] = useState<'ringing' | 'connected' | 'ended'>(session.status);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(session.isMuted);
  const [isSpeakerOn, setIsSpeakerOn] = useState(session.isSpeakerOn);
  const [isVideoMuted, setIsVideoMuted] = useState(session.isVideoMuted);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Audio ring synthesizer
  useEffect(() => {
    let stopRing = () => {};
    if (status === 'ringing') {
      stopRing = SoundEffects.playRingPulse();
      // Simulate answer after 2.4 seconds
      const timer = setTimeout(() => {
        stopRing();
        setStatus('connected');
        SoundEffects.playConnectedTone();
      }, 2400);

      return () => {
        stopRing();
        clearTimeout(timer);
      };
    }
    return () => stopRing();
  }, [status]);

  // Call timer when connected
  useEffect(() => {
    let interval: number;
    if (status === 'connected') {
      interval = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnd = () => {
    SoundEffects.playEndCallTone();
    onEndCall(duration);
  };

  const filters = [
    { label: 'None', emoji: '' },
    { label: 'Cool', emoji: '🕶️' },
    { label: 'Crown', emoji: '👑' },
    { label: 'Hearts', emoji: '💖' },
    { label: 'Bunny', emoji: '🐰' },
    { label: 'Party', emoji: '🎉' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 pt-safe pb-safe select-none animate-in fade-in overflow-hidden">
      {/* Background ambient lighting */}
      <div className={`absolute inset-0 pointer-events-none opacity-40 transition-all duration-700 ${
        session.type === 'video'
          ? 'bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950'
          : 'bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950'
      }`} />

      {/* Top Banner: Demo Notice & Connection Status */}
      <div className="relative z-10 space-y-2 text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold shadow-md animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t('demo_call_notice')}</span>
        </div>

        <h3 className="text-xl font-black tracking-tight text-white mt-2">
          {session.user.name}
        </h3>

        <p className="text-xs font-semibold text-indigo-300">
          {status === 'ringing' ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              {t('ringing')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {formatTimer(duration)}
            </span>
          )}
        </p>
      </div>

      {/* Middle Stage: Simulated Avatar or Simulated Video View */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4">
        {session.type === 'voice' ? (
          /* Voice Call Visualizer */
          <div className="relative flex items-center justify-center">
            {/* Animated Sound Wave Rings */}
            {status === 'connected' && (
              <>
                <div className="absolute w-64 h-64 rounded-full border border-indigo-500/20 bg-indigo-500/5 animate-ping opacity-30" />
                <div className="absolute w-52 h-52 rounded-full border border-purple-500/30 bg-purple-500/10 animate-pulse" />
                <div className="absolute w-40 h-40 rounded-full border border-pink-500/40 bg-pink-500/15" />
              </>
            )}

            {/* User Avatar */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-2xl shadow-indigo-500/40">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-6xl">
                {session.user.avatar}
              </div>
            </div>

            {/* Muted indicator badge if muted */}
            {isMuted && (
              <span className="absolute -bottom-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-slate-900 flex items-center gap-1">
                <MicOff className="w-3 h-3" /> Muted
              </span>
            )}
          </div>
        ) : (
          /* Video Call Simulated View */
          <div className="relative w-full max-w-sm h-80 rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center">
            {/* Ambient simulated camera noise / particles */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950/80" />

            {/* Simulated peer video avatar representation */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-1 mb-2 shadow-xl">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-5xl">
                  {session.user.avatar}
                </div>
                {/* Active AR Face Sticker */}
                {activeFilter && (
                  <div className="absolute -top-4 -right-2 text-4xl animate-bounce">
                    {activeFilter}
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {session.user.name}'s Camera (Simulated)
              </span>
            </div>

            {/* Front-Facing Camera Self View In Corner */}
            <div className="absolute top-3 right-3 w-20 h-28 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-lg flex flex-col items-center justify-center overflow-hidden z-20">
              {isVideoMuted ? (
                <div className="flex flex-col items-center text-slate-400">
                  <VideoOff className="w-4 h-4 mb-1" />
                  <span className="text-[9px]">Off</span>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <span className="text-2xl">🦊</span>
                  <span className="text-[9px] text-slate-400 mt-1">You</span>
                  {activeFilter && (
                    <span className="absolute -top-2 right-0 text-sm">
                      {activeFilter}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Filter Selector Bar for Video Call */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-center gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
              <Smile className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
              {filters.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFilter(f.emoji || null)}
                  className={`min-h-[32px] px-2 py-0.5 rounded-xl text-xs font-semibold transition-all ${
                    activeFilter === f.emoji || (!activeFilter && !f.emoji)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {f.emoji ? f.emoji : 'None'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="relative z-10 max-w-sm w-full mx-auto space-y-4">
        {/* Call Action Buttons Grid */}
        <div className="flex items-center justify-around gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-xl">
          {/* Mute Mic Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`min-h-[50px] min-w-[50px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* Speaker On / Off (Voice) or Video Camera On / Off (Video) */}
          {session.type === 'voice' ? (
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`min-h-[50px] min-w-[50px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                isSpeakerOn
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Speaker"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-[10px] font-medium">Speaker</span>
            </button>
          ) : (
            <button
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className={`min-h-[50px] min-w-[50px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                isVideoMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Camera"
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              <span className="text-[10px] font-medium">Camera</span>
            </button>
          )}

          {/* Flip Audio / Camera */}
          {session.type === 'video' && (
            <button
              onClick={() => setIsFrontCamera(!isFrontCamera)}
              className="min-h-[50px] min-w-[50px] rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              title="Flip Camera"
            >
              <SwitchCamera className="w-5 h-5" />
              <span className="text-[10px] font-medium">Flip</span>
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={handleEnd}
            className="min-h-[50px] min-w-[56px] px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
            title={t('end_call')}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[10px] font-bold">End</span>
          </button>
        </div>
      </div>
    </div>
  );
};
