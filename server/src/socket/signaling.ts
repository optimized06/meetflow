import { Server, Socket } from 'socket.io';

interface RoomParticipant {
  socketId: string;
  peerId: string;
  displayName: string;
  avatarUrl?: string;
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

    socket.on('join-room', (data: { roomId: string; peerId: string; displayName: string; avatarUrl?: string; isMicOn: boolean; isCameraOn: boolean; authToken?: string }) => {
      const { roomId, peerId, displayName, avatarUrl, isMicOn, isCameraOn, authToken } = data;
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
        avatarUrl,
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

      // Tell the joining user what role they were assigned (critical for host detection)
      socket.emit('role-changed', { peerId, role });

      // Notify others that a new peer joined
      socket.to(roomId).emit('peer-joined', participant);
      
      // System message: user joined
      io.to(roomId).emit('chat-message', {
        id: `sys-${Date.now()}-${peerId}-join`,
        userId: 'system',
        userName: 'System',
        content: `🟢 ${displayName} joined the meeting`,
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
      if (!participant) return;

      // Screen share permission check
      if (data.isScreenSharing && !room.settings.screenShareEnabled && participant.role === 'participant') {
        socket.emit('error-message', { message: 'Screen sharing is currently disabled by host' });
        return;
      }

      const prevScreenSharing = participant.isScreenSharing;

      if (data.isMicOn !== undefined) participant.isMicOn = data.isMicOn;
      if (data.isCameraOn !== undefined) participant.isCameraOn = data.isCameraOn;
      if (data.isScreenSharing !== undefined) participant.isScreenSharing = data.isScreenSharing;
      socket.to(currentRoom).emit('peer-media-state-changed', { peerId: currentPeerId, ...data });

      // Screen sharing system event
      if (data.isScreenSharing !== undefined && data.isScreenSharing !== prevScreenSharing) {
        io.to(currentRoom).emit('chat-message', {
          id: `sys-${Date.now()}-${currentPeerId}-screen`,
          userId: 'system',
          userName: 'System',
          content: data.isScreenSharing
            ? `🖥️ ${participant.displayName} started screen sharing`
            : `🖥️ ${participant.displayName} stopped screen sharing`,
          timestamp: new Date().toISOString(),
          type: 'system',
        });
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
        
        io.to(currentRoom).emit('chat-message', {
          id: `sys-${Date.now()}-${currentPeerId}-hand`,
          userId: 'system',
          userName: 'System',
          content: data.isHandRaised
            ? `✋ ${participant.displayName} raised their hand`
            : `✋ ${participant.displayName} lowered their hand`,
          timestamp: new Date().toISOString(),
          type: 'system',
        });
      }
    });

    // Chat message
    socket.on('chat-message', (data: { id?: string; content: string; timestamp: string; type?: string; fileUrl?: string; fileName?: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const participant = room.participants.get(currentPeerId);
      if (!participant) return;

      // Validate chat permissions: participants cannot send if chat is disabled
      if (!room.settings.chatEnabled && participant.role === 'participant') {
        socket.emit('error-message', { message: 'Chat is currently disabled by host' });
        return;
      }

      socket.to(currentRoom).emit('chat-message', {
        id: data.id || `${Date.now()}-${currentPeerId}`,
        userId: currentPeerId,
        userName: participant.displayName,
        content: data.content,
        timestamp: data.timestamp,
        type: data.type || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      });
    });

    // Host & Co-host Moderation validation
    socket.on('update-room-settings', (settings: { isLocked?: boolean; chatEnabled?: boolean; screenShareEnabled?: boolean }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const sender = room.participants.get(currentPeerId);
      
      // Only primary host can update room settings
      if (!sender || sender.role !== 'host') return;
      
      const prevLocked = room.settings.isLocked;
      room.settings = { ...room.settings, ...settings };
      io.to(currentRoom).emit('room-settings-changed', room.settings);

      // System notification if locked status changed
      if (settings.isLocked !== undefined && settings.isLocked !== prevLocked) {
        io.to(currentRoom).emit('chat-message', {
          id: `sys-${Date.now()}-lock`,
          userId: 'system',
          userName: 'System',
          content: settings.isLocked ? '🔒 Meeting has been locked by the host' : '🔓 Meeting has been unlocked',
          timestamp: new Date().toISOString(),
          type: 'system',
        });
      }
    });

    socket.on('mute-participant', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const sender = room.participants.get(currentPeerId);
      if (!sender || (sender.role !== 'host' && sender.role !== 'co-host')) return;

      const target = room.participants.get(data.targetPeerId);
      if (!target) return;

      // Co-host cannot mute the host or other co-hosts
      if (sender.role === 'co-host' && (target.role === 'host' || target.role === 'co-host')) return;

      target.isMicOn = false;
      io.to(target.socketId).emit('force-mute');
      socket.to(currentRoom).emit('peer-media-state-changed', { peerId: data.targetPeerId, isMicOn: false });
    });

    socket.on('remove-participant', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const sender = room.participants.get(currentPeerId);
      if (!sender || (sender.role !== 'host' && sender.role !== 'co-host')) return;

      const target = room.participants.get(data.targetPeerId);
      if (!target) return;

      // Co-host can only remove regular participants
      if (sender.role === 'co-host' && (target.role === 'host' || target.role === 'co-host')) return;
      // Host cannot remove themselves with this event
      if (data.targetPeerId === currentPeerId) return;

      // Notify the kicked target
      io.to(target.socketId).emit('kicked');

      // Remove from room state immediately
      room.participants.delete(data.targetPeerId);
      socket.to(currentRoom).emit('peer-left', { peerId: data.targetPeerId });

      // System notification: user removed
      io.to(currentRoom).emit('chat-message', {
        id: `sys-${Date.now()}-${data.targetPeerId}-removed`,
        userId: 'system',
        userName: 'System',
        content: `🚫 ${target.displayName} was removed from the meeting`,
        timestamp: new Date().toISOString(),
        type: 'system',
      });
    });

    // Make co-host (Host only)
    socket.on('make-cohost', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const sender = room.participants.get(currentPeerId);
      
      // Only host can promote to co-host
      if (!sender || sender.role !== 'host') return;
      
      const target = room.participants.get(data.targetPeerId);
      if (target && target.role === 'participant') {
        target.role = 'co-host';
        io.to(currentRoom).emit('role-changed', { peerId: data.targetPeerId, role: 'co-host' });
        
        io.to(currentRoom).emit('chat-message', {
          id: `sys-${Date.now()}-${data.targetPeerId}-cohost`,
          userId: 'system',
          userName: 'System',
          content: `🛡️ ${target.displayName} was promoted to co-host`,
          timestamp: new Date().toISOString(),
          type: 'system',
        });
      }
    });

    // Demote co-host (Host only)
    socket.on('demote-cohost', (data: { targetPeerId: string }) => {
      if (!currentRoom || !currentPeerId) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const sender = room.participants.get(currentPeerId);

      // Only host can remove co-host privileges
      if (!sender || sender.role !== 'host') return;

      const target = room.participants.get(data.targetPeerId);
      if (target && target.role === 'co-host') {
        target.role = 'participant';
        io.to(currentRoom).emit('role-changed', { peerId: data.targetPeerId, role: 'participant' });

        io.to(currentRoom).emit('chat-message', {
          id: `sys-${Date.now()}-${data.targetPeerId}-demote`,
          userId: 'system',
          userName: 'System',
          content: `👤 ${target.displayName} is no longer a co-host`,
          timestamp: new Date().toISOString(),
          type: 'system',
        });
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
              content: `🔴 ${participant.displayName} left the meeting`,
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
              io.to(currentRoom).emit('chat-message', {
                id: `sys-${Date.now()}-${nextPerson.peerId}-newhost`,
                userId: 'system',
                userName: 'System',
                content: `👑 ${nextPerson.displayName} is now the host`,
                timestamp: new Date().toISOString(),
                type: 'system',
              });
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
