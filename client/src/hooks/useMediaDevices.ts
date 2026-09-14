import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface MediaState {
  isMicOn: boolean;
  isCameraOn: boolean;
  selectedMic: string;
  selectedCamera: string;
}

export interface UseMediaDevicesReturn {
  localStream: MediaStream | null;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  mediaState: MediaState;
  permissionError: string | null;
  errorCode: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'UnknownError' | null;
  isLoading: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  selectMic: (deviceId: string) => Promise<void>;
  selectCamera: (deviceId: string) => Promise<void>;
  startMedia: () => Promise<void>;
  stopMedia: () => void;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'UnknownError' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaState, setMediaState] = useState<MediaState>({
    isMicOn: true,
    isCameraOn: true,
    selectedMic: '',
    selectedCamera: '',
  });

  const streamRef = useRef<MediaStream | null>(null);

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
          kind: d.kind as MediaDeviceKind,
        }));
      const video = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 5)}`,
          kind: d.kind as MediaDeviceKind,
        }));
      setAudioDevices(audio);
      setVideoDevices(video);
      return { audio, video };
    } catch {
      console.error('Failed to enumerate devices');
      return { audio: [], video: [] };
    }
  }, []);

  const getStream = useCallback(
    async (audioId?: string, videoId?: string) => {
      const constraints: MediaStreamConstraints = {
        audio: audioId ? { deviceId: { exact: audioId } } : true,
        video: videoId
          ? { deviceId: { exact: videoId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
      } catch (err: unknown) {
        const error = err as DOMException;
        if (error.name === 'NotAllowedError') {
          throw Object.assign(new Error('Camera access denied.'), { code: 'NotAllowedError' });
        } else if (error.name === 'NotFoundError') {
          throw Object.assign(new Error('No camera or microphone found. Please connect a device and try again.'), { code: 'NotFoundError' });
        } else if (error.name === 'NotReadableError') {
          throw Object.assign(new Error('Your camera or microphone is already in use by another application.'), { code: 'NotReadableError' });
        } else {
          throw Object.assign(new Error(`Failed to access media devices: ${error.message}`), { code: 'UnknownError' });
        }
      }
    },
    []
  );

  const startMedia = useCallback(async () => {
    setIsLoading(true);
    setPermissionError(null);
    setErrorCode(null);

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await getStream(
        mediaState.selectedMic || undefined,
        mediaState.selectedCamera || undefined
      );

      streamRef.current = stream;
      setLocalStream(stream);

      // Enumerate devices after getting permissions (labels become available)
      const { audio, video } = await enumerateDevices();

      // Set default selected devices
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      setMediaState((prev) => ({
        ...prev,
        selectedMic: audioTrack?.getSettings().deviceId || audio[0]?.deviceId || '',
        selectedCamera: videoTrack?.getSettings().deviceId || video[0]?.deviceId || '',
      }));
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Failed to start media devices';
      setPermissionError(message);
      setErrorCode(err.code || 'UnknownError');
    } finally {
      setIsLoading(false);
    }
  }, [getStream, enumerateDevices, mediaState.selectedMic, mediaState.selectedCamera]);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMediaState((prev) => ({ ...prev, isMicOn: !prev.isMicOn }));
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMediaState((prev) => ({ ...prev, isCameraOn: !prev.isCameraOn }));
    }
  }, []);

  const selectMic = useCallback(
    async (deviceId: string) => {
      setMediaState((prev) => ({ ...prev, selectedMic: deviceId }));

      if (streamRef.current) {
        // Stop existing audio tracks
        streamRef.current.getAudioTracks().forEach((t) => t.stop());

        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } },
          });
          const newAudioTrack = newStream.getAudioTracks()[0];
          if (newAudioTrack) {
            // Remove old audio tracks and add new one
            streamRef.current.getAudioTracks().forEach((t) => streamRef.current!.removeTrack(t));
            streamRef.current.addTrack(newAudioTrack);
            newAudioTrack.enabled = mediaState.isMicOn;
            setLocalStream(new MediaStream(streamRef.current.getTracks()));
          }
        } catch {
          setPermissionError('Failed to switch microphone');
        }
      }
    },
    [mediaState.isMicOn]
  );

  const selectCamera = useCallback(
    async (deviceId: string) => {
      setMediaState((prev) => ({ ...prev, selectedCamera: deviceId }));

      if (streamRef.current) {
        // Stop existing video tracks
        streamRef.current.getVideoTracks().forEach((t) => t.stop());

        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (newVideoTrack) {
            streamRef.current.getVideoTracks().forEach((t) => streamRef.current!.removeTrack(t));
            streamRef.current.addTrack(newVideoTrack);
            newVideoTrack.enabled = mediaState.isCameraOn;
            setLocalStream(new MediaStream(streamRef.current.getTracks()));
          }
        } catch {
          setPermissionError('Failed to switch camera');
        }
      }
    },
    [mediaState.isCameraOn]
  );

  // Listen for device changes (plug/unplug)
  useEffect(() => {
    const handler = () => enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, [enumerateDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
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
    stopMedia,
  };
}
