import { Server, Socket } from 'socket.io';

interface RoomParticipant {
  socketId: string;
  peerId: string;
  displayName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  role: 'host' | 'co-host' | 'participant';
}

// In-memory room state
interface RoomState {
  participants: Map<string, RoomParticipant>;
  settings: {
    isLocked: boolean;
    chatEnabled: boolean;
    screenShareEnabled: boolean;
  };
}

const rooms = new Map<string, RoomState>();

export const handleSignaling = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);
    let currentRoom: string | null = null;
    let currentPeerId: string | null = null;

    socket.on('join-room', (data: { roomId: string; peerId: string; displayName: string; isMicOn: boolean; isCameraOn: boolean }) => {
      const { roomId, peerId, displayName, isMicOn, isCameraOn } = data;
      currentRoom = roomId;
      currentPeerId = peerId;

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          participants: new Map(),
          settings: {
            isLocked: false,
            chatEnabled: true,
            screenShareEnabled: true,
          }
        });
      }

      const room = rooms.get(roomId)!;
      
      if (room.settings.isLocked) {
        socket.emit('room-locked');
        return;
      }

      // First person to join the room is the host
      const isFirst = room.participants.size === 0;
      const role = isFirst ? 'host' : 'participant';

      const participant: RoomParticipant = {
        socketId: socket.id,
        peerId,
        displayName,
        isMicOn,
        isCameraOn,
        isHandRaised: false,
        isScreenSharing: false,
        role,
      };
      room.participants.set(peerId, participant);

      // Send the list of existing participants and current settings to the new joiner
      const existingParticipants = Array.from(room.participants.values()).filter(p => p.peerId !== peerId);
      socket.emit('room-participants', existingParticipants, room.settings);

      // Notify others that a new peer joined
      socket.to(roomId).emit('peer-joined', participant);
      
      // System message: user joined
      io.to(roomId).emit('chat-message', {
        id: `sys-${Date.now()}-${peerId}`,
        userId: 'system',
        userName: 'System',
        content: `${displayName} joined the meeting`,
        timestamp: new Date().toISOString(),
        type: 'system',
      });

      console.log(`Peer ${peerId} (${displayName}) joined room ${roomId} as ${role}. Total: ${room.participants.size}`);
    });

    // WebRTC Signaling
    socket.on('offer', (data: { targetPeerId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const target = room.participants.get(data.targetPeerId);
      if (target) {
        io.to(target.socketId).emit('offer', { fromPeerId: currentPeerId, sdp: data.sdp });
      }
    });

    socket.on('answer', (data: { targetPeerId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const target = room.participants.get(data.targetPeerId);
      if (target) {
        io.to(target.socketId).emit('answer', { fromPeerId: currentPeerId, sdp: data.sdp });
      }
    });

    socket.on('ice-candidate', (data: { targetPeerId: string; candidate: RTCIceCandidateInit }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const target = room.participants.get(data.targetPeerId);
      if (target) {
        io.to(target.socketId).emit('ice-candidate', { fromPeerId: currentPeerId, candidate: data.candidate });
      }
    });

    // Media state changes
    socket.on('media-state-change', (data: { isMicOn?: boolean; isCameraOn?: boolean; isScreenSharing?: boolean }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const participant = room.participants.get(currentPeerId);
      if (participant) {
        if (data.isMicOn !== undefined) participant.isMicOn = data.isMicOn;
        if (data.isCameraOn !== undefined) participant.isCameraOn = data.isCameraOn;
        if (data.isScreenSharing !== undefined) participant.isScreenSharing = data.isScreenSharing;
        socket.to(currentRoom).emit('peer-media-state-changed', { peerId: currentPeerId, ...data });
      }
    });

    // Hand raise
    socket.on('toggle-hand', (data: { isHandRaised: boolean }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const participant = room.participants.get(currentPeerId);
      if (participant) {
        participant.isHandRaised = data.isHandRaised;
        socket.to(currentRoom).emit('peer-hand-changed', { peerId: currentPeerId, isHandRaised: data.isHandRaised });
        
        if (data.isHandRaised) {
          io.to(currentRoom).emit('chat-message', {
            id: `sys-${Date.now()}-${currentPeerId}-hand`,
            userId: 'system',
            userName: 'System',
            content: `${participant.displayName} raised their hand ✋`,
            timestamp: new Date().toISOString(),
            type: 'system',
          });
        }
      }
    });

    // Chat message
    socket.on('chat-message', (data: { content: string; timestamp: string; type?: string; fileUrl?: string; fileName?: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const participant = room.participants.get(currentPeerId);
      if (participant) {
        socket.to(currentRoom).emit('chat-message', {
          id: `${Date.now()}-${currentPeerId}`,
          userId: currentPeerId,
          userName: participant.displayName,
          content: data.content,
          timestamp: data.timestamp,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        });
      }
    });

    // Host actions
    const checkHost = (roomMap: Map<string, RoomParticipant>, pId: string) => {
      const p = roomMap.get(pId);
      return p && (p.role === 'host' || p.role === 'co-host');
    };

    socket.on('update-room-settings', (settings: { isLocked?: boolean; chatEnabled?: boolean; screenShareEnabled?: boolean }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room || !checkHost(room.participants, currentPeerId)) return;
      
      room.settings = { ...room.settings, ...settings };
      io.to(currentRoom).emit('room-settings-changed', room.settings);
    });

    socket.on('mute-participant', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room || !checkHost(room.participants, currentPeerId)) return;
      
      const target = room.participants.get(data.targetPeerId);
      if (target) {
        target.isMicOn = false;
        io.to(target.socketId).emit('force-mute');
        socket.to(currentRoom).emit('peer-media-state-changed', { peerId: data.targetPeerId, isMicOn: false });
      }
    });

    socket.on('remove-participant', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room || !checkHost(room.participants, currentPeerId)) return;
      
      const target = room.participants.get(data.targetPeerId);
      if (target) {
        io.to(target.socketId).emit('kicked');
      }
    });

    socket.on('make-cohost', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room || !checkHost(room.participants, currentPeerId)) return;
      
      const target = room.participants.get(data.targetPeerId);
      if (target) {
        target.role = 'co-host';
        io.to(currentRoom).emit('role-changed', { peerId: data.targetPeerId, role: 'co-host' });
      }
    });

    // Leave / disconnect
    const handleLeave = () => {
      if (currentRoom && currentPeerId) {
        const room = rooms.get(currentRoom);
        if (room) {
          const participant = room.participants.get(currentPeerId);
          room.participants.delete(currentPeerId);
          socket.to(currentRoom).emit('peer-left', { peerId: currentPeerId });
          
          if (participant) {
            io.to(currentRoom).emit('chat-message', {
              id: `sys-${Date.now()}-${currentPeerId}-leave`,
              userId: 'system',
              userName: 'System',
              content: `${participant.displayName} left the meeting`,
              timestamp: new Date().toISOString(),
              type: 'system',
            });
          }

          console.log(`Peer ${currentPeerId} left room ${currentRoom}. Remaining: ${room.participants.size}`);
          if (room.participants.size === 0) {
            rooms.delete(currentRoom);
          } else if (participant?.role === 'host') {
            // Assign host to next person if host leaves
            const nextPerson = Array.from(room.participants.values())[0];
            if (nextPerson) {
              nextPerson.role = 'host';
              io.to(currentRoom).emit('role-changed', { peerId: nextPerson.peerId, role: 'host' });
            }
          }
        }
        socket.leave(currentRoom);
        currentRoom = null;
        currentPeerId = null;
      }
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      handleLeave();
    });
  });
};
