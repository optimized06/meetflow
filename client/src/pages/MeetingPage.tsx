import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PreJoinScreen } from '../components/PreJoinScreen';
import { VideoGrid } from '../components/VideoGrid';
import { VideoTile } from '../components/VideoTile';
import { ControlsBar } from '../components/ControlsBar';
import { ChatPanel } from '../components/ChatPanel';
import { ParticipantsPanel } from '../components/ParticipantsPanel';
import { useWebRTC } from '../hooks/useWebRTC';
import { toast } from 'sonner';
import type { ChatMessage } from '../types';

type MeetingState = 'lobby' | 'in-call';

const MeetingPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [meetingState, setMeetingState] = useState<MeetingState>('lobby');
  const [displayName, setDisplayName] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  
  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const {
    participants,
    localPeerId,
    localRole,
    roomSettings,
    isScreenSharing,
    screenStream,
    networkStatus,
    isConnected,
    broadcastMediaState,
    toggleHand,
    sendChatMessage,
    mutePeer,
    kickPeer,
    promotePeer,
    demotePeer,
    updateRoomSettings,
    startScreenShare,
    stopScreenShare,
    on,
  } = useWebRTC({
    roomId: roomId || '',
    displayName,
    localStream,
    isMicOn: micOn,
    isCameraOn: videoOn,
    enabled: meetingState === 'in-call',
  });

  // Handle 'room-locked' event when trying to join
  useEffect(() => {
    if (meetingState !== 'lobby') return;
    const unsub = on<any>('room-locked', () => {
      setIsLocked(true);
    });
    return unsub;
  }, [meetingState, on]);

  // Handle incoming chat messages - decoupled from isChatOpen to avoid duplicate listeners on re-render
  useEffect(() => {
    if (meetingState !== 'in-call') return;
    const unsub = on<ChatMessage>('chat-message', (msg) => {
      // If broadcast message is from local user, it's already added optimistically
      if (msg.userId === localPeerId && msg.type !== 'system') {
        return;
      }

      setMessages((prev) => {
        // Prevent duplicate insertions
        if (prev.some((m) => m.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
      
      // Show toast if chat is closed and it's not a system message
      if (!isChatOpenRef.current && msg.type !== 'system') {
        toast.message(`Message from ${msg.userName}`, {
          description: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
        });
      }
    });
    return unsub;
  }, [meetingState, on, localPeerId]);

  const handleJoin = useCallback((name: string, stream: MediaStream | null) => {
    setDisplayName(name);
    setLocalStream(stream);
    // Determine initial state based on if stream has tracks
    const hasAudio = stream?.getAudioTracks().some(t => t.enabled) ?? false;
    const hasVideo = stream?.getVideoTracks().some(t => t.enabled) ?? false;
    setMicOn(hasAudio);
    setVideoOn(hasVideo);
    setMeetingState('in-call');

    // Record join in history
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const mockUser = localStorage.getItem('mock_user');
      const userId = mockUser ? JSON.parse(mockUser).id : '';
      
      fetch(`${apiUrl}/api/meetings/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': userId
        },
        body: JSON.stringify({ title: `Room ${roomId}` }) // Fallback title
      });
    } catch (e) {
      console.error('Failed to record meeting join', e);
    }
  }, [roomId]);

  const handleLeave = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
    navigate('/dashboard');
  }, [localStream, navigate]);

  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMicOn((prev) => {
        broadcastMediaState({ isMicOn: !prev });
        return !prev;
      });
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setVideoOn((prev) => {
        broadcastMediaState({ isCameraOn: !prev });
        return !prev;
      });
    }
  };

  const handleToggleHand = () => {
    setIsHandRaised((prev) => {
      toggleHand(!prev);
      return !prev;
    });
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare().catch(console.error);
    }
  };

  const handleSendMessage = (content: string, type: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    sendChatMessage(content, type, fileUrl, fileName);
    // Optimistically add to local messages
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        userId: localPeerId,
        userName: displayName,
        content,
        timestamp: new Date().toISOString(),
        type,
        fileUrl,
        fileName
      },
    ]);
  };

  if (!roomId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-red-400">Invalid meeting room.</p>
      </div>
    );
  }

  // -- LOBBY STATE --
  if (meetingState === 'lobby') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="lobby"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <PreJoinScreen 
            roomId={roomId || ''} 
            onJoin={handleJoin} 
            isLocked={isLocked || roomSettings.isLocked} 
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  const totalParticipants = participants.length + 1; // +1 for local user
  const isLocalHost = localRole === 'host' || localRole === 'co-host';
  const canShareScreen = roomSettings.screenShareEnabled || isLocalHost;

  // -- IN-CALL STATE --
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="in-call"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="h-[calc(100vh-4rem)] flex flex-col bg-black overflow-hidden relative"
      >
        {/* Main Content Area */}
        <div className="flex-grow flex relative overflow-hidden">
          
          {/* Reconnecting Overlay */}
          <AnimatePresence>
            {networkStatus === 'reconnecting' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-yellow-500/90 backdrop-blur-md text-black font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                Reconnecting...
              </motion.div>
            )}
            {networkStatus === 'failed' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 backdrop-blur-md text-white font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
              >
                <span className="text-xl">⚠️</span>
                Connection Failed
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Grid Area */}
          <div className={`flex-grow p-2 md:p-4 overflow-hidden relative transition-all duration-300 ${isChatOpen || isPeopleOpen ? 'mr-80 lg:mr-96' : ''}`}>
            <VideoGrid participantCount={totalParticipants}>
              {/* Local Participant Tile */}
              <VideoTile
                stream={isScreenSharing ? screenStream : localStream}
                displayName={`${displayName} (You)`}
                isMicOn={micOn}
                isCameraOn={videoOn}
                isHandRaised={isHandRaised}
                isSpeaking={false} // Local speaking indicator not implemented
                isScreenSharing={isScreenSharing}
                connectionQuality={isConnected ? 'good' : 'poor'}
                isLocal={true}
                participantAvatar={localStorage.getItem('user_avatar') || undefined}
              />
              
              {/* Remote Participants */}
              {participants.map((p) => (
                <VideoTile
                  key={p.peerId}
                  stream={p.stream}
                  displayName={p.displayName}
                  isMicOn={p.isMicOn}
                  isCameraOn={p.isCameraOn}
                  isHandRaised={p.isHandRaised}
                  isSpeaking={p.isSpeaking}
                  isScreenSharing={p.isScreenSharing}
                  connectionQuality={p.connectionQuality}
                  isLocal={false}
                  participantAvatar={p.avatarUrl}
                />
              ))}
            </VideoGrid>
          </div>

          {/* Side Panels */}
          <ChatPanel
            isOpen={isChatOpen}
            messages={messages}
            chatEnabled={roomSettings.chatEnabled}
            localRole={localRole}
            onSendMessage={handleSendMessage}
            onClose={() => setIsChatOpen(false)}
            localPeerId={localPeerId}
          />
          
          <ParticipantsPanel
            isOpen={isPeopleOpen}
            participants={participants}
            localPeerId={localPeerId}
            localDisplayName={displayName}
            localIsMicOn={micOn}
            localIsCameraOn={videoOn}
            localRole={localRole}
            roomSettings={roomSettings}
            onClose={() => setIsPeopleOpen(false)}
            onMutePeer={mutePeer}
            onKickPeer={kickPeer}
            onPromotePeer={promotePeer}
            onDemotePeer={demotePeer}
            onUpdateRoomSettings={updateRoomSettings}
          />
        </div>

        {/* Control Bar */}
        <ControlsBar
          isMicOn={micOn}
          isCameraOn={videoOn}
          isScreenSharing={isScreenSharing}
          isHandRaised={isHandRaised}
          isChatOpen={isChatOpen}
          isPeopleOpen={isPeopleOpen}
          participantCount={totalParticipants}
          roomId={roomId}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleVideo}
          onToggleScreenShare={canShareScreen ? handleToggleScreenShare : () => {}}
          onToggleHand={handleToggleHand}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            setIsPeopleOpen(false); // Close people if opening chat
          }}
          onTogglePeople={() => {
            setIsPeopleOpen(!isPeopleOpen);
            setIsChatOpen(false); // Close chat if opening people
          }}
          onLeave={handleLeave}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default MeetingPage;
