import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, MonitorUp, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'good' | 'fair' | 'poor' | 'unknown';
  isLocal: boolean;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  displayName,
  isMicOn,
  isCameraOn,
  isHandRaised,
  isSpeaking,
  isScreenSharing,
  connectionQuality,
  isLocal,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, isCameraOn, isScreenSharing]);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderConnectionQuality = () => {
    switch (connectionQuality) {
      case 'good':
        return (
          <div className="group relative flex items-center justify-center">
            <SignalHigh className="w-4 h-4 text-green-500" />
            <span className="absolute top-full mt-2 right-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">🟢 Excellent</span>
          </div>
        );
      case 'fair':
        return (
          <div className="group relative flex items-center justify-center">
            <SignalMedium className="w-4 h-4 text-yellow-500" />
            <span className="absolute top-full mt-2 right-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">🟡 Fair</span>
          </div>
        );
      case 'poor':
        return (
          <div className="group relative flex items-center justify-center">
            <SignalLow className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="absolute top-full mt-2 right-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">🔴 Poor</span>
          </div>
        );
      default:
        return <Signal className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-surface-lighter/50 border border-white/5 transition-all duration-300 ${
        isSpeaking ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''
      } ${className}`}
    >
      {/* Video or Avatar */}
      {stream && (isCameraOn || isScreenSharing) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-primary text-white text-4xl font-bold shadow-lg">
          {getInitials(displayName)}
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
        {/* Top Row: Hand Raised & Connection */}
        <div className="flex justify-between items-start w-full">
          <AnimatePresence>
            {isHandRaised && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  bounce: 0.5
                }}
                className="bg-surface/80 backdrop-blur-md rounded-full p-1.5 shadow-lg border border-white/10"
              >
                <motion.span 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="block text-xl"
                >
                  ✋
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="ml-auto bg-surface/80 backdrop-blur-md rounded-full p-1.5 shadow-lg border border-white/10">
            {renderConnectionQuality()}
          </div>
        </div>

        {/* Bottom Row: Name Badge, Screen Share, Mic Status */}
        <div className="flex justify-between items-end w-full">
          <div className="flex items-center gap-2 max-w-[70%]">
            <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-lg border border-white/10 truncate">
              <span className="text-white text-sm font-medium truncate">
                {displayName} {isLocal && "(You)"}
              </span>
            </div>
            {isScreenSharing && (
              <div className="flex items-center gap-1 bg-primary/80 backdrop-blur-md rounded-lg px-2 py-1.5 shadow-lg border border-white/10">
                <MonitorUp className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className={`p-1.5 rounded-full shadow-lg border border-white/10 backdrop-blur-md ${isMicOn ? 'bg-surface/80 text-green-400' : 'bg-red-500/80 text-white'}`}>
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </div>
  );
};
