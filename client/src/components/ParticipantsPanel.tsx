import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, Hand, MoreVertical, Shield, ShieldOff, UserMinus, MicOff as ForceMuteIcon, Lock, Unlock, MessageSquare, MonitorUp } from 'lucide-react';
import type { Participant, RoomSettings } from '../types';

export interface ParticipantsPanelProps {
  isOpen: boolean;
  participants: Participant[];
  localPeerId: string;
  localDisplayName: string;
  localIsMicOn: boolean;
  localIsCameraOn: boolean;
  localRole: 'host' | 'co-host' | 'participant';
  roomSettings: RoomSettings;
  onClose: () => void;
  onMutePeer: (peerId: string) => void;
  onKickPeer: (peerId: string) => void;
  onPromotePeer: (peerId: string) => void;
  onDemotePeer?: (peerId: string) => void;
  onUpdateRoomSettings: (settings: Partial<RoomSettings>) => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  isOpen,
  participants,
  localDisplayName,
  localIsMicOn,
  localIsCameraOn,
  localRole,
  roomSettings,
  onClose,
  onMutePeer,
  onKickPeer,
  onPromotePeer,
  onDemotePeer,
  onUpdateRoomSettings
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const toggleDropdown = (peerId: string) => {
    setOpenDropdownId(openDropdownId === peerId ? null : peerId);
  };

  const isHost = localRole === 'host';
  const isCoHost = localRole === 'co-host';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-80 lg:w-96 bg-black/80 backdrop-blur-3xl border-l border-white/[0.05] flex flex-col shadow-2xl pb-20 md:pb-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface/50">
            <h2 className="text-lg font-semibold text-white">Participants ({participants.length + 1})</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Host Settings - Host only */}
            {isHost && (
              <div className="p-4 border-b border-white/10 bg-surface/30">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Host Settings</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white">
                      {roomSettings.isLocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                      Lock Meeting
                    </div>
                    <button 
                      onClick={() => onUpdateRoomSettings({ isLocked: !roomSettings.isLocked })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${roomSettings.isLocked ? 'bg-primary' : 'bg-surface-lighter'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${roomSettings.isLocked ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      Allow Chat
                    </div>
                    <button 
                      onClick={() => onUpdateRoomSettings({ chatEnabled: !roomSettings.chatEnabled })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${roomSettings.chatEnabled ? 'bg-primary' : 'bg-surface-lighter'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${roomSettings.chatEnabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <MonitorUp className="w-4 h-4 text-slate-400" />
                      Allow Screen Share
                    </div>
                    <button 
                      onClick={() => onUpdateRoomSettings({ screenShareEnabled: !roomSettings.screenShareEnabled })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${roomSettings.screenShareEnabled ? 'bg-primary' : 'bg-surface-lighter'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${roomSettings.screenShareEnabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants List */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">People</p>
              
              {/* Local User */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center relative">
                    <span className="text-sm font-bold text-white">
                      {localDisplayName.charAt(0).toUpperCase()}
                    </span>
                    {(localRole === 'host' || localRole === 'co-host') && (
                      <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 border border-white/10">
                        <Shield className={`w-3 h-3 ${localRole === 'host' ? 'text-yellow-400' : 'text-blue-400'}`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{localDisplayName} (You)</p>
                    <p className="text-[10px] text-slate-400 capitalize">{localRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  {localIsMicOn ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                  {localIsCameraOn ? <Video className="w-4 h-4 text-green-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                </div>
              </div>

              {/* Remote Users */}
              {participants.map((p) => {
                const canModerate = (isHost && p.role !== 'host') || (isCoHost && (!p.role || p.role === 'participant'));

                return (
                  <motion.div layout initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, scale: 0.95}} key={p.peerId} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors group relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative">
                        <span className="text-sm font-medium text-white">
                          {p.displayName.charAt(0).toUpperCase()}
                        </span>
                        {(p.role === 'host' || p.role === 'co-host') && (
                          <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 border border-white/10">
                            <Shield className={`w-3 h-3 ${p.role === 'host' ? 'text-yellow-400' : 'text-blue-400'}`} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{p.displayName}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{p.role || 'participant'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {p.isHandRaised && <Hand className="w-4 h-4 text-yellow-400 animate-bounce" />}
                      {p.isMicOn ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                      {p.isCameraOn ? <Video className="w-4 h-4 text-green-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                      
                      {/* Host & Co-host Moderation Dropdown */}
                      {canModerate && (
                        <div className="relative ml-2">
                          <button 
                            onClick={() => toggleDropdown(p.peerId)}
                            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            aria-label={`Moderation options for ${p.displayName}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {openDropdownId === p.peerId && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 mt-2 w-44 bg-surface-lighter/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                              >
                                {/* Mute - available for Host and Co-host */}
                                <button
                                  onClick={() => { onMutePeer(p.peerId); setOpenDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                >
                                  <ForceMuteIcon className="w-4 h-4 text-slate-400" /> Mute
                                </button>

                                {/* Make co-host - Host only, when target is normal participant */}
                                {isHost && p.role !== 'co-host' && (
                                  <button
                                    onClick={() => { onPromotePeer(p.peerId); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Shield className="w-4 h-4 text-blue-400" /> Make co-host
                                  </button>
                                )}

                                {/* Remove co-host - Host only, when target is co-host */}
                                {isHost && p.role === 'co-host' && (
                                  <button
                                    onClick={() => { onDemotePeer?.(p.peerId); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                  >
                                    <ShieldOff className="w-4 h-4 text-yellow-400" /> Remove co-host
                                  </button>
                                )}

                                {/* Remove participant - Host or Co-host (for participants) */}
                                <button
                                  onClick={() => { onKickPeer(p.peerId); setOpenDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors border-t border-white/5"
                                >
                                  <UserMinus className="w-4 h-4" /> Remove
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

