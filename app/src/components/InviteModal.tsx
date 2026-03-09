import { useState } from 'react';
import { Copy, X } from 'lucide-react';

interface Props {
  roomCode: string;
  onDismiss: () => void;
}

export function InviteModal({ roomCode, onDismiss }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinLink = `${window.location.origin}/?join=${roomCode}`;

  function copyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(joinLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-white mb-2">Room Created</h2>
        <p className="text-gray-400 text-sm mb-6">
          Share this code with anyone you want to invite. They'll need to enter it on the join screen.
        </p>
        <div className="bg-bg border border-white/10 rounded-xl p-6 mb-6 text-center">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Room Code</p>
          <p className="font-mono text-3xl font-bold text-accent tracking-widest">{roomCode}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={copyCode}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dim text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Copy size={16} />
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors"
          >
            <Copy size={16} />
            {copiedLink ? 'Copied!' : 'Copy Join Link'}
          </button>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white py-2 text-sm transition-colors"
          >
            Enter Room →
          </button>
        </div>
      </div>
    </div>
  );
}
