import { useEffect, useRef } from 'react';
import { MicOff } from 'lucide-react';

interface Props {
  stream: MediaStream | null;
  displayName: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal?: boolean;
}

export function PeerTile({ stream, displayName, isMuted, isSpeaking, isLocal = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled && t.readyState === 'live') ?? false;

  return (
    <div
      className={`relative bg-surface rounded-xl overflow-hidden aspect-video transition-all duration-150 ${
        isSpeaking ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : 'ring-1 ring-white/5'
      }`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
          {displayName}
          {isLocal && ' (you)'}
        </span>
        {isMuted && (
          <span className="bg-black/60 p-1 rounded-md backdrop-blur-sm">
            <MicOff size={10} className="text-red-400" />
          </span>
        )}
      </div>

      {/* Speaking ring pulse */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-accent animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
