import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { VideoPreview } from './VideoPreview';

interface PreJoinScreenProps {
  roomId: string;
  onJoin: (displayName: string, stream: MediaStream | null) => void;
  isLocked?: boolean;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({ roomId, onJoin, isLocked }) => {
  const { user } = useAuth();
  const {
    localStream,
    audioDevices,
    videoDevices,
    mediaState,
    permissionError,
    errorCode,
    isLoading,
    toggleMic,
    toggleCamera,
    selectMic,
    selectCamera,
    startMedia,
  } = useMediaDevices();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [isJoining, setIsJoining] = useState(false);

  // Start media on mount
  useEffect(() => {
    startMedia();
  }, []);

  // Connection check
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('failed');
        }
      } catch {
        setConnectionStatus('failed');
      }
    };
    checkConnection();
  }, []);

  const noDevices = !isLoading && !localStream && !!permissionError && errorCode === 'NotFoundError';

  const handleJoin = async () => {
    if (!displayName.trim()) return;
    setIsJoining(true);
    // Small delay for animation
    await new Promise((resolve) => setTimeout(resolve, 600));
    onJoin(displayName.trim(), localStream);
  };

  const canJoin = displayName.trim().length > 0 && connectionStatus !== 'failed';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Ready to join?</h1>
          <p className="text-slate-400">
            Room:{' '}
            <span className="font-mono text-primary-light bg-primary/10 px-2 py-0.5 rounded-md text-sm">
              {roomId}
            </span>
          </p>
        </motion.div>

        {isLocked ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Meeting Locked</h2>
            <p className="text-slate-400">
              New participants cannot join. The host has locked this meeting room.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Camera Preview — takes 3 cols */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-3"
            >
            <div className="relative aspect-video bg-surface-light rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
                  <p className="text-slate-400 text-sm">Starting camera...</p>
                </div>
              ) : noDevices ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-lighter flex items-center justify-center border-2 border-white/10">
                    <User className="w-10 h-10 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">No camera detected</p>
                    <p className="text-slate-400 text-sm max-w-sm">You can still join the meeting without a camera or microphone.</p>
                  </div>
                  <button
                    onClick={startMedia}
                    className="mt-1 px-4 py-2 bg-primary/20 text-primary-light rounded-lg hover:bg-primary/30 transition-colors text-sm font-medium"
                  >
                    Retry devices
                  </button>
                </div>
              ) : permissionError && errorCode === 'NotAllowedError' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-black/80">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg mb-1">Camera access denied.</p>
                    <p className="text-slate-300 text-sm max-w-sm mb-4">
                      Enable camera permissions in your browser settings or continue with your camera disabled.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Allow continuing with no stream
                      setDisplayName(displayName || 'User');
                    }}
                    className="px-6 py-2.5 bg-primary/90 text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium shadow-lg shadow-primary/20"
                  >
                    Continue
                  </button>
                </div>
              ) : permissionError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Device Error</p>
                    <p className="text-slate-400 text-sm max-w-sm">{permissionError}</p>
                  </div>
                  <button
                    onClick={startMedia}
                    className="mt-2 px-4 py-2 bg-primary/20 text-primary-light rounded-lg hover:bg-primary/30 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : localStream && mediaState.isCameraOn ? (
                <VideoPreview
                  stream={localStream}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-surface-lighter flex items-center justify-center border-2 border-white/10">
                    <User className="w-12 h-12 text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-sm">Camera is off</p>
                </div>
              )}

              {/* Audio Level Indicator */}
              {localStream && mediaState.isMicOn && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Mic className="w-3.5 h-3.5 text-green-400" />
                  <AudioLevelMeter stream={localStream} />
                </div>
              )}

              {/* Camera off overlay badge */}
              {!mediaState.isCameraOn && !permissionError && !isLoading && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <VideoOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-slate-300">Camera off</span>
                </div>
              )}
            </div>

            {/* Media Controls under video */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                id="prejoin-mic-toggle"
                onClick={toggleMic}
                disabled={!localStream}
                className={`group relative p-4 rounded-full transition-all duration-300 ${
                  mediaState.isMicOn
                    ? 'bg-surface-light hover:bg-surface-lighter text-white border border-white/10'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {mediaState.isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {mediaState.isMicOn ? 'Mute' : 'Unmute'}
                </span>
              </button>

              <button
                id="prejoin-camera-toggle"
                onClick={toggleCamera}
                disabled={!localStream}
                className={`group relative p-4 rounded-full transition-all duration-300 ${
                  mediaState.isCameraOn
                    ? 'bg-surface-light hover:bg-surface-lighter text-white border border-white/10'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {mediaState.isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {mediaState.isCameraOn ? 'Turn off' : 'Turn on'}
                </span>
              </button>

              <button
                id="prejoin-settings-toggle"
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                className={`group relative p-4 rounded-full transition-all duration-300 border ${
                  showDeviceSettings
                    ? 'bg-primary/15 text-primary-light border-primary/30'
                    : 'bg-surface-light hover:bg-surface-lighter text-white border-white/10'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Devices
                </span>
              </button>
            </div>
          </motion.div>

          {/* Right Panel — takes 2 cols */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {/* Display Name */}
            <div className="glass-card p-5">
              <label htmlFor="display-name" className="block text-sm font-medium text-slate-300 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-surface/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  maxLength={40}
                />
              </div>
            </div>

            {/* Connection Status */}
            <div className="glass-card p-5">
              <p className="text-sm font-medium text-slate-300 mb-3">Connection Status</p>
              <div className="flex items-center gap-3">
                {connectionStatus === 'checking' && (
                  <>
                    <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-sm text-yellow-400">Checking connection...</span>
                  </>
                )}
                {connectionStatus === 'connected' && (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Connected to server</span>
                  </>
                )}
                {connectionStatus === 'failed' && (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Server unreachable</span>
                  </>
                )}
              </div>
            </div>

            {/* Device Selection */}
            <AnimatePresence>
              {showDeviceSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-5 space-y-4">
                    <p className="text-sm font-medium text-slate-300">Device Settings</p>

                    {/* Microphone Selector */}
                    <div>
                      <label htmlFor="mic-select" className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <Mic className="w-3 h-3" /> Microphone
                      </label>
                      <div className="relative">
                        <select
                          id="mic-select"
                          value={mediaState.selectedMic}
                          onChange={(e) => selectMic(e.target.value)}
                          className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                        >
                          {audioDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label}
                            </option>
                          ))}
                          {audioDevices.length === 0 && (
                            <option disabled>No microphones found</option>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Camera Selector */}
                    <div>
                      <label htmlFor="camera-select" className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <Video className="w-3 h-3" /> Camera
                      </label>
                      <div className="relative">
                        <select
                          id="camera-select"
                          value={mediaState.selectedCamera}
                          onChange={(e) => selectCamera(e.target.value)}
                          className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                        >
                          {videoDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label}
                            </option>
                          ))}
                          {videoDevices.length === 0 && (
                            <option disabled>No cameras found</option>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Join Button */}
            <motion.button
              id="prejoin-join-button"
              onClick={handleJoin}
              disabled={!canJoin || isJoining}
              whileHover={canJoin ? { scale: 1.02 } : {}}
              whileTap={canJoin ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                canJoin
                  ? 'bg-gradient-primary shadow-lg shadow-primary/20 cursor-pointer'
                  : 'bg-surface-lighter text-slate-500 cursor-not-allowed'
              }`}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Meeting'
              )}
            </motion.button>

            {/* No-devices info banner (friendly, not scary) */}
            {noDevices && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3"
              >
                <VideoOff className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-300 font-medium">No devices found</p>
                  <p className="text-xs text-yellow-400/80 mt-0.5">You'll join as a viewer without audio/video. You can still use chat.</p>
                </div>
              </motion.div>
            )}

            {/* Permission Error Banner (only when devices exist but are blocked) */}
            {permissionError && !noDevices && errorCode !== 'NotAllowedError' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-medium">Device Error</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{permissionError}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
        )}
      </motion.div>
    </div>
  );
};

/* ---------- Audio Level Meter ---------- */
const AudioLevelMeter: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let animationId: number;
    let audioContext: AudioContext;

    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLevel(Math.min(avg / 80, 1)); // normalize 0-1
        animationId = requestAnimationFrame(update);
      };
      update();
    } catch {
      // Audio context not supported
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext) audioContext.close();
    };
  }, [stream]);

  return (
    <div className="flex items-center gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-green-400"
          animate={{
            height: level > i * 0.2 ? `${8 + level * 10}px` : '3px',
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
  );
};
