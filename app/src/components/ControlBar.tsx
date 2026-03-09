import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, PhoneOff } from 'lucide-react';

interface Props {
  micEnabled: boolean;
  camEnabled: boolean;
  isScreensharing: boolean;
  chatOpen: boolean;
  unreadCount: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenshare: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

export function ControlBar({
  micEnabled,
  camEnabled,
  isScreensharing,
  chatOpen,
  unreadCount,
  onToggleMic,
  onToggleCam,
  onToggleScreenshare,
  onToggleChat,
  onLeave,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-surface/80 backdrop-blur-sm border-t border-white/5">
      <ControlButton
        onClick={onToggleMic}
        active={micEnabled}
        title={micEnabled ? 'Mute' : 'Unmute'}
      >
        {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </ControlButton>

      <ControlButton
        onClick={onToggleCam}
        active={camEnabled}
        title={camEnabled ? 'Stop Camera' : 'Start Camera'}
      >
        {camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </ControlButton>

      <ControlButton
        onClick={onToggleScreenshare}
        active={!isScreensharing}
        activeClass="bg-accent/20 text-accent hover:bg-accent/30"
        title={isScreensharing ? 'Stop Sharing' : 'Share Screen'}
      >
        {isScreensharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
      </ControlButton>

      <ControlButton
        onClick={onToggleChat}
        active={!chatOpen}
        title="Chat"
      >
        <div className="relative">
          <MessageSquare size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </ControlButton>

      <button
        onClick={onLeave}
        title="Leave Room"
        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors ml-2"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  activeClass?: string;
  children: React.ReactNode;
}

function ControlButton({ onClick, active, title, activeClass, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-3 rounded-xl transition-colors ${
        active
          ? (activeClass ?? 'bg-white/10 text-white hover:bg-white/20')
          : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
