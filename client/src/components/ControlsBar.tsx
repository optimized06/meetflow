import React, { useState, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, 
  MessageSquare, Users, Settings, PhoneOff, Copy, Check, Clock
} from 'lucide-react';

export interface ControlsBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isChatOpen: boolean;
  isPeopleOpen: boolean;
  participantCount: number;
  roomId: string;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleChat: () => void;
  onTogglePeople: () => void;
  onLeave: () => void;
  onOpenSettings?: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  isHandRaised,
  isChatOpen,
  isPeopleOpen,
  participantCount,
  roomId,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onToggleChat,
  onTogglePeople,
  onLeave,
  onOpenSettings
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const IconButton = ({ 
    icon: Icon, onClick, active, activeClass, inactiveClass, label, badge 
  }: any) => (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={onClick}
        className={`relative p-3.5 rounded-full transition-all duration-300 flex items-center justify-center border border-white/5 shadow-lg ${
          active ? activeClass : inactiveClass
        }`}
      >
        <Icon className="w-5 h-5 text-white" />
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 bg-surface-lighter text-xs text-white px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center font-medium border border-surface">
            {badge}
          </span>
        )}
      </button>
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-surface text-white text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/10 z-50">
        {label}
      </span>
    </div>
  );

  return (
    <div className="h-20 w-full bg-surface-light/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 lg:px-8 z-40">
      
      {/* Left Section: Timer and Room ID */}
      <div className="hidden md:flex flex-1 items-center gap-4 text-white/80">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4" />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-2 bg-surface-lighter/50 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="text-sm font-medium tracking-wide">{roomId}</span>
          <button onClick={copyRoomId} className="hover:text-white transition-colors" title="Copy Room ID">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Section: Controls */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
        <IconButton 
          icon={isMicOn ? Mic : MicOff}
          onClick={onToggleMic}
          active={isMicOn}
          activeClass="bg-surface-lighter hover:bg-white/20"
          inactiveClass="bg-red-500 hover:bg-red-600"
          label={isMicOn ? "Turn off mic" : "Turn on mic"}
        />
        <IconButton 
          icon={isCameraOn ? Video : VideoOff}
          onClick={onToggleCamera}
          active={isCameraOn}
          activeClass="bg-surface-lighter hover:bg-white/20"
          inactiveClass="bg-red-500 hover:bg-red-600"
          label={isCameraOn ? "Turn off camera" : "Turn on camera"}
        />
        <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>
        <IconButton 
          icon={MonitorUp}
          onClick={onToggleScreenShare}
          active={isScreenSharing}
          activeClass="bg-primary hover:bg-primary-dark"
          inactiveClass="bg-surface-lighter hover:bg-white/20"
          label={isScreenSharing ? "Stop sharing" : "Share screen"}
        />
        <IconButton 
          icon={Hand}
          onClick={onToggleHand}
          active={isHandRaised}
          activeClass="bg-yellow-500 hover:bg-yellow-600 text-white"
          inactiveClass="bg-surface-lighter hover:bg-white/20"
          label={isHandRaised ? "Lower hand" : "Raise hand"}
        />
        <IconButton 
          icon={MessageSquare}
          onClick={onToggleChat}
          active={isChatOpen}
          activeClass="bg-primary-light/40 hover:bg-primary-light/60 text-primary-light"
          inactiveClass="bg-surface-lighter hover:bg-white/20"
          label="Chat"
        />
        <IconButton 
          icon={Users}
          onClick={onTogglePeople}
          active={isPeopleOpen}
          activeClass="bg-primary-light/40 hover:bg-primary-light/60"
          inactiveClass="bg-surface-lighter hover:bg-white/20"
          label="People"
          badge={participantCount}
        />
        {onOpenSettings && (
          <IconButton 
            icon={Settings}
            onClick={onOpenSettings}
            active={false}
            activeClass="bg-surface-lighter hover:bg-white/20"
            inactiveClass="bg-surface-lighter hover:bg-white/20"
            label="Settings"
          />
        )}
        <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>
        
        {/* Leave Button */}
        <div className="relative group">
          <button
            onClick={onLeave}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-full transition-all duration-300 shadow-lg font-medium"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Right Section: Empty to maintain center balance */}
      <div className="hidden md:flex flex-1 justify-end">
        {/* Can be used for extra features later */}
      </div>
    </div>
  );
};
