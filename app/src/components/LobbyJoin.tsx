import { useState } from 'react';
import { isValidRoomCode, formatRoomCode } from '../lib/roomCode';

interface Props {
  initialCode?: string;
  onJoin: (roomCode: string, displayName: string) => void;
  onBack: () => void;
}

export function LobbyJoin({ initialCode = '', onJoin, onBack }: Props) {
  const [code, setCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState('');
  const [touched, setTouched] = useState(false);

  const formatted = formatRoomCode(code);
  const valid = isValidRoomCode(formatted);

  function handleCodeChange(value: string) {
    // Auto-format: uppercase, insert dashes after WORD segments
    const clean = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(clean);
    setTouched(true);
  }

  function handleJoin() {
    if (!valid) return;
    onJoin(formatted, displayName.trim() || randomName());
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
        <h2 className="text-2xl font-semibold text-white mb-1">Join a Room</h2>
        <p className="text-gray-400 text-sm">Enter the code you received.</p>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <input
            type="text"
            placeholder="WORD-WORD-0000"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className={`w-full bg-surface border rounded-lg px-4 py-3 font-mono text-white placeholder-gray-500 focus:outline-none transition-colors uppercase tracking-widest ${
              touched && code
                ? valid
                  ? 'border-green-500'
                  : 'border-red-500'
                : 'border-white/10 focus:border-accent'
            }`}
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            spellCheck={false}
          />
          {touched && code && !valid && (
            <p className="text-red-400 text-xs mt-1">
              Format: WORD-WORD-0000 (e.g. DELTA-ECHO-4821)
            </p>
          )}
        </div>
        <input
          type="text"
          placeholder="Display name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
          maxLength={32}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
      </div>
      <button
        onClick={handleJoin}
        disabled={!valid}
        className="bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Join Room
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
