import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import type { RoomSettings } from '../types';
import { toast } from 'sonner';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface Participant {
  peerId: string;
  displayName: string;
  avatarUrl?: string;
  stream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  connectionQuality: 'good' | 'fair' | 'poor' | 'unknown';
  role?: 'host' | 'co-host' | 'participant';
}

interface UseWebRTCOptions {
  roomId: string;
  displayName: string;
  localStream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  enabled: boolean; // only activate when in-call
}

export function useWebRTC({
  roomId,
  displayName,
  localStream,
  isMicOn,
  isCameraOn,
  enabled,
}: UseWebRTCOptions) {
  const { isConnected, emit, on } = useSocket();
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localPeerIdRef = useRef<string>(`peer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const [localRole, setLocalRole] = useState<'host' | 'co-host' | 'participant'>('participant');
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    isLocked: false,
    chatEnabled: true,
    screenShareEnabled: true,
  });
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'reconnecting' | 'failed'>('connected');
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const joinedRef = useRef(false);

  // Create a peer connection for a remote peer
  const createPeerConnection = useCallback(
    (remotePeerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Determine the stream to use for this peer connection
      let streamToUse = localStream;

      if (!streamToUse) {
        console.log('[WebRTC] No local stream. Generating active dummy tracks (Audio+Video) to initialize connection.');
        // Create an active dummy video track
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const dummyStream = canvas.captureStream(1); // 1 FPS

        // Create an active silent audio track
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();
          const oscillator = audioCtx.createOscillator();
          oscillator.connect(dest);
          oscillator.start();
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            dummyStream.addTrack(audioTrack);
          }
        } catch (err) {
          console.warn('[WebRTC] Could not create dummy audio track:', err);
        }
        
        streamToUse = dummyStream;
      }

      // Add tracks normally, just as if we had hardware
      streamToUse.getTracks().forEach((track) => {
        pc.addTrack(track, streamToUse);
      });

      // Handle incoming tracks from remote peer
      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote ontrack event:', {
          peerId: remotePeerId,
          trackKind: event.track.kind,
          streamsLength: event.streams.length
        });
        const [remoteStream] = event.streams;
        if (remoteStream) {
          setParticipants((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(remotePeerId);
            if (existing) {
              updated.set(remotePeerId, { ...existing, stream: remoteStream });
            }
            return updated;
          });
        } else {
          console.warn('[WebRTC] Remote ontrack event had no streams associated!');
        }
      };

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emit('ice-candidate', {
            targetPeerId: remotePeerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Connection state monitoring & ICE Restart (Module 10 Reliability)
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        let quality: Participant['connectionQuality'] = 'unknown';
        if (state === 'connected') quality = 'good';
        else if (state === 'connecting') quality = 'fair';
        else if (state === 'failed' || state === 'disconnected') quality = 'poor';

        setParticipants((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(remotePeerId);
          if (existing) {
            updated.set(remotePeerId, { ...existing, connectionQuality: quality });
          }
          return updated;
        });

        if (state === 'failed' || state === 'disconnected') {
          console.warn(`[WebRTC] Peer ${remotePeerId} connection state: ${state}. Triggering ICE restart.`);
          setNetworkStatus('reconnecting');
          // ICE Restart
          try {
            pc.restartIce();
            pc.createOffer().then(offer => {
              return pc.setLocalDescription(offer);
            }).then(() => {
              emit('offer', { targetPeerId: remotePeerId, sdp: pc.localDescription });
              setTimeout(() => setNetworkStatus('connected'), 2000); // Reset UI after attempt
            }).catch(err => {
              console.error('[WebRTC] ICE Restart failed:', err);
              setNetworkStatus('failed');
            });
          } catch (e) {
            console.error('[WebRTC] Failed to restart ICE', e);
          }
        }
      };

      peerConnectionsRef.current.set(remotePeerId, pc);
      return pc;
    },
    [localStream, emit]
  );

  // Create offer to a remote peer
  const createOffer = useCallback(
    async (remotePeerId: string) => {
      const pc = createPeerConnection(remotePeerId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emit('offer', { targetPeerId: remotePeerId, sdp: pc.localDescription });
      } catch (err) {
        console.error('[WebRTC] Failed to create offer:', err);
      }
    },
    [createPeerConnection, emit]
  );

  // Join the room
  useEffect(() => {
    if (!enabled || !isConnected || joinedRef.current) return;
    
    joinedRef.current = true;
    const userAvatar = localStorage.getItem('user_avatar') || undefined;
    emit('join-room', {
      roomId,
      peerId: localPeerIdRef.current,
      displayName,
      avatarUrl: userAvatar,
      isMicOn,
      isCameraOn,
    });

    return () => {
      if (joinedRef.current) {
        emit('leave-room');
        joinedRef.current = false;
        // Close all peer connections
        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();
        setParticipants(new Map());
      }
    };
  }, [enabled, isConnected]);

  // Handle signaling events
  useEffect(() => {
    if (!enabled || !isConnected) return;

    // Receive existing participants when joining
    const unsub1 = on<any>('room-participants', (...args: any[]) => {
      const data = args[0];
      const settings = args[1];
      if (settings) {
        setRoomSettings(settings);
      }
      const existingParticipants = data || [];
      existingParticipants.forEach((p: any) => {
        setParticipants((prev) => {
          const updated = new Map(prev);
          updated.set(p.peerId, {
            peerId: p.peerId,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            stream: null,
            isMicOn: p.isMicOn,
            isCameraOn: p.isCameraOn,
            isHandRaised: p.isHandRaised || false,
            isScreenSharing: p.isScreenSharing || false,
            isSpeaking: false,
            connectionQuality: 'unknown',
            role: p.role || 'participant',
          });
          return updated;
        });
        // Send offer to each existing participant
        createOffer(p.peerId);
      });
    });

    // New peer joined
    const unsub2 = on<any>('peer-joined', (participant) => {
      console.log('[WebRTC] Peer joined:', participant.displayName);
      toast.success(`${participant.displayName} joined the meeting`);
      setParticipants((prev) => {
        const updated = new Map(prev);
        updated.set(participant.peerId, {
          peerId: participant.peerId,
          displayName: participant.displayName,
          avatarUrl: participant.avatarUrl,
          stream: null,
          isMicOn: participant.isMicOn,
          isCameraOn: participant.isCameraOn,
          isHandRaised: false,
          isScreenSharing: false,
          isSpeaking: false,
          connectionQuality: 'unknown',
          role: participant.role || 'participant',
        });
        return updated;
      });
      // The new peer will send us an offer, we just wait
    });

    // Receive offer
    const unsub3 = on<any>('offer', async (data) => {
      const { fromPeerId, sdp } = data;
      let pc = peerConnectionsRef.current.get(fromPeerId);
      if (!pc) {
        pc = createPeerConnection(fromPeerId);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('answer', { targetPeerId: fromPeerId, sdp: pc.localDescription });
      } catch (err) {
        console.error('[WebRTC] Failed to handle offer:', err);
      }
    });

    // Receive answer
    const unsub4 = on<any>('answer', async (data) => {
      const { fromPeerId, sdp } = data;
      const pc = peerConnectionsRef.current.get(fromPeerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (err) {
          console.error('[WebRTC] Failed to handle answer:', err);
        }
      }
    });

    // Receive ICE candidate
    const unsub5 = on<any>('ice-candidate', async (data) => {
      const { fromPeerId, candidate } = data;
      const pc = peerConnectionsRef.current.get(fromPeerId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Failed to add ICE candidate:', err);
        }
      }
    });

    // Peer left
    const unsub6 = on<any>('peer-left', (data) => {
      const { peerId } = data;
      console.log('[WebRTC] Peer left:', peerId);
      const pc = peerConnectionsRef.current.get(peerId);
      
      setParticipants((prev) => {
        const p = prev.get(peerId);
        if (p) toast.info(`${p.displayName} left the meeting`);
        
        const updated = new Map(prev);
        updated.delete(peerId);
        return updated;
      });
      
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(peerId);
      }
    });

    // Media state changes from peers
    const unsub7 = on<any>('peer-media-state-changed', (data) => {
      setParticipants((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(data.peerId);
        if (existing) {
          updated.set(data.peerId, {
            ...existing,
            ...(data.isMicOn !== undefined && { isMicOn: data.isMicOn }),
            ...(data.isCameraOn !== undefined && { isCameraOn: data.isCameraOn }),
            ...(data.isScreenSharing !== undefined && { isScreenSharing: data.isScreenSharing }),
          });
        }
        return updated;
      });
    });

    // Hand raise from peers
    const unsub8 = on<any>('peer-hand-changed', (data) => {
      setParticipants((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(data.peerId);
        if (existing) {
          updated.set(data.peerId, { ...existing, isHandRaised: data.isHandRaised });
        }
        return updated;
      });
    });

    // Role changed
    const unsub9 = on<any>('role-changed', (data) => {
      if (data.peerId === localPeerIdRef.current) {
        setLocalRole(data.role);
      } else {
        setParticipants((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(data.peerId);
          if (existing) {
            updated.set(data.peerId, { ...existing, role: data.role });
          }
          return updated;
        });
      }
    });

    // Kicked
    const unsub10 = on<any>('kicked', () => {
      alert("You have been removed from the meeting by a host.");
      window.location.href = '/dashboard';
    });

    // Force mute
    const unsub11 = on<any>('force-mute', () => {
      if (localStream) {
        localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      window.dispatchEvent(new Event('force-mute-local'));
    });

    // Room Settings changed
    const unsub12 = on<RoomSettings>('room-settings-changed', (settings) => {
      setRoomSettings(settings);
    });

    // Handle WebSocket disconnection/reconnection (Module 10)
    const unsubDisconnect = on<void>('disconnect', () => {
      console.warn('[Socket] Disconnected from server');
      setNetworkStatus('reconnecting');
    });

    const unsubConnect = on<void>('connect', () => {
      console.log('[Socket] Reconnected to server');
      setNetworkStatus('connected');
    });

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4();
      unsub5(); unsub6(); unsub7(); unsub8();
      unsub9(); unsub10(); unsub11(); unsub12();
      unsubDisconnect(); unsubConnect();
    };
  }, [enabled, isConnected, createOffer, createPeerConnection, emit, on, localStream]);

  // Broadcast media state changes
  const broadcastMediaState = useCallback(
    (state: { isMicOn?: boolean; isCameraOn?: boolean; isScreenSharing?: boolean }) => {
      emit('media-state-change', state);
    },
    [emit]
  );

  // Toggle hand raise
  const toggleHand = useCallback(
    (isHandRaised: boolean) => {
      emit('toggle-hand', { isHandRaised });
    },
    [emit]
  );

  // Send chat message
  const sendChatMessage = useCallback(
    (content: string, type: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
      emit('chat-message', { 
        content, 
        timestamp: new Date().toISOString(),
        type,
        fileUrl,
        fileName
      });
    },
    [emit]
  );

  // Host Actions
  const mutePeer = useCallback((peerId: string) => {
    emit('mute-participant', { targetPeerId: peerId });
  }, [emit]);

  const kickPeer = useCallback((peerId: string) => {
    emit('remove-participant', { targetPeerId: peerId });
  }, [emit]);

  const promotePeer = useCallback((peerId: string) => {
    emit('make-cohost', { targetPeerId: peerId });
  }, [emit]);

  const demotePeer = useCallback((peerId: string) => {
    emit('demote-cohost', { targetPeerId: peerId });
  }, [emit]);

  const updateRoomSettings = useCallback((settings: Partial<RoomSettings>) => {
    emit('update-room-settings', settings);
  }, [emit]);

  const startScreenShare = useCallback(async () => {
    console.log('[WebRTC] Attempting to start screen share...');
    if (isScreenSharing || !navigator.mediaDevices?.getDisplayMedia) {
      alert("Screen sharing is not supported on this device.");
      return false;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      console.log('[WebRTC] getDisplayMedia success. Stream obtained.');
      const track = displayStream.getVideoTracks()[0];
      console.log('[WebRTC] Screen video track obtained:', track.label);
      screenTrackRef.current = track;

      // Replace video track on all peer connections
      let replaceCount = 0;
      peerConnectionsRef.current.forEach((pc, peerId) => {
        // Find a transceiver capable of video
        const transceiver = pc.getTransceivers().find(t => 
          t.receiver.track.kind === 'video' || 
          t.sender.track?.kind === 'video'
        );
        if (transceiver && transceiver.sender) {
          console.log(`[WebRTC] Found video RTCRtpSender for peer ${peerId}. Replacing track...`);
          transceiver.sender.replaceTrack(track).then(() => {
            console.log(`[WebRTC] replaceTrack SUCCESS for peer ${peerId}`);
          }).catch(err => {
            console.error(`[WebRTC] replaceTrack FAILED for peer ${peerId}:`, err);
          });
          replaceCount++;
        } else {
          console.warn(`[WebRTC] No video RTCRtpSender found for peer ${peerId}`);
        }
      });
      console.log(`[WebRTC] replaceTrack initiated on ${replaceCount} peer connections.`);

      // Handle user stopping stream natively (e.g. clicking "Stop sharing" in browser UI)
      track.onended = () => {
        console.log('[WebRTC] Screen track ended natively.');
        stopScreenShare();
      };

      setScreenStream(displayStream);
      setIsScreenSharing(true);
      broadcastMediaState({ isScreenSharing: true });
      return true;
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
      return false;
    }
  }, [isScreenSharing, broadcastMediaState]);

  const stopScreenShare = useCallback(async () => {
    console.log('[WebRTC] Stopping screen share...');
    if (!isScreenSharing) return;
    
    // Stop the screen track
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      console.log('[WebRTC] Screen track stopped and cleared.');
    }

    // Revert to camera track if it exists, otherwise to null
    const cameraTrack = localStream?.getVideoTracks()[0] || null;
    console.log('[WebRTC] Reverting to camera track:', cameraTrack ? cameraTrack.label : 'null (no camera)');
    
    peerConnectionsRef.current.forEach((pc, peerId) => {
      const transceiver = pc.getTransceivers().find(t => 
        t.receiver.track.kind === 'video' || 
        t.sender.track?.kind === 'video'
      );
      if (transceiver && transceiver.sender) {
        if (!cameraTrack) {
          // Firefox sometimes crashes or freezes when replacing with null. 
          // If there's no camera track, we should just let it be, or replace with another dummy track.
          // The best approach is to pause/disable the sender if possible, or replace with null and catch.
          transceiver.sender.replaceTrack(null).then(() => {
            console.log(`[WebRTC] Revert replaceTrack (null) SUCCESS for peer ${peerId}`);
          }).catch(err => {
            console.error(`[WebRTC] Revert replaceTrack FAILED for peer ${peerId}:`, err);
          });
        } else {
          transceiver.sender.replaceTrack(cameraTrack).then(() => {
            console.log(`[WebRTC] Revert replaceTrack SUCCESS for peer ${peerId}`);
          }).catch(err => {
            console.error(`[WebRTC] Revert replaceTrack FAILED for peer ${peerId}:`, err);
          });
        }
      }
    });

    setScreenStream(null);
    setIsScreenSharing(false);
    broadcastMediaState({ isScreenSharing: false });
  }, [isScreenSharing, localStream, broadcastMediaState]);

  // Adaptive Bitrate & Quality Monitoring (Module 12)
  useEffect(() => {
    if (!isConnected) return;
    
    const monitorStats = async () => {
      peerConnectionsRef.current.forEach(async (pc, peerId) => {
        if (pc.connectionState !== 'connected') return;
        
        try {
          const stats = await pc.getStats();
          let packetLoss = 0;
          let rtt = 0;
          
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const lost = report.packetsLost || 0;
              const received = report.packetsReceived || 0;
              if (received + lost > 0) {
                 packetLoss = lost / (received + lost);
              }
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              rtt = report.currentRoundTripTime || report.roundTripTime || 0;
            }
          });

          // Determine quality based on heuristics
          let quality: 'good' | 'fair' | 'poor' = 'good';
          if (packetLoss > 0.08 || rtt > 0.5) quality = 'poor';
          else if (packetLoss > 0.03 || rtt > 0.2) quality = 'fair';

          // Update participant quality state
          setParticipants(prev => {
            const updated = new Map(prev);
            const existing = updated.get(peerId);
            if (existing && existing.connectionQuality !== quality) {
              updated.set(peerId, { ...existing, connectionQuality: quality });
            }
            return updated;
          });

          // Dynamically scale video encoding
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && sender.track) {
            const params = sender.getParameters();
            if (params.encodings && params.encodings.length > 0) {
               let changed = false;
               const encoding = params.encodings[0];
               
               if (quality === 'poor' && encoding.scaleResolutionDownBy !== 4) {
                 encoding.scaleResolutionDownBy = 4; // 360p or lower
                 encoding.maxBitrate = 200000;
                 changed = true;
               } else if (quality === 'fair' && encoding.scaleResolutionDownBy !== 2) {
                 encoding.scaleResolutionDownBy = 2; // 480p
                 encoding.maxBitrate = 500000;
                 changed = true;
               } else if (quality === 'good' && encoding.scaleResolutionDownBy !== 1) {
                 encoding.scaleResolutionDownBy = 1; // 720p/1080p
                 encoding.maxBitrate = 1500000;
                 changed = true;
               }
               
               if (changed) {
                 await sender.setParameters(params);
                 console.log(`[WebRTC] Scaled bandwidth for ${peerId} down to ${quality} (scaleFactor: ${encoding.scaleResolutionDownBy})`);
               }
            }
          }
        } catch (err) {
           console.warn('[WebRTC] Failed to get stats for peer', peerId);
        }
      });
    };

    const interval = setInterval(monitorStats, 3000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    participants: Array.from(participants.values()),
    localPeerId: localPeerIdRef.current,
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
  };
}
