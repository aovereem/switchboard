import { useState } from 'react';
import { SIGNALING_URL } from '../lib/constants';

interface Props {
  onCreated: (roomCode: string, displayName: string) => void;
  onBack: () => void;
}

export function LobbyCreate({ onCreated, onBack }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const signalingBase = SIGNALING_URL.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
      const res = await fetch(`${signalingBase}/room`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create room');
      const { roomCode } = (await res.json()) as { roomCode: string };
      onCreated(roomCode, displayName.trim() || randomName());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-white self-start transition-colors"
      >
        ← Back
      </button>
      <div>
        <h2 className="text-2xl font-semibold text-white mb-1">Create a Room</h2>
        <p className="text-gray-400 text-sm">A code will be generated for you to share.</p>
      </div>
      <input
        type="text"
        placeholder="Display name (optional)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="bg-surface border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
        maxLength={32}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {loading ? 'Creating…' : 'Create Room'}
      </button>
    </div>
  );
}

function randomName(): string {
  const adjectives = ['Swift', 'Bold', 'Calm', 'Bright', 'Keen', 'Wild'];
  const nouns = ['Fox', 'Hawk', 'Bear', 'Wolf', 'Lynx', 'Crow'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}
