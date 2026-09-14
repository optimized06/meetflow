import { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  stream: MediaStream | null;
  isMirrored?: boolean;
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  stream,
  isMirrored = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`${className} ${isMirrored ? 'scale-x-[-1]' : ''}`}
    />
  );
};
