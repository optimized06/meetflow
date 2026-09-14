export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Meeting {
  id: string;
  roomId: string;
  title: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'ended';
}

export interface RoomSettings {
  isLocked: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'system' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface Participant {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  connectionQuality: 'good' | 'fair' | 'poor' | 'unknown';
  role?: 'host' | 'co-host' | 'participant';
}
