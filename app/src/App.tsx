import { useState, useEffect } from 'react';
import { LobbyCreate } from './components/LobbyCreate';
import { LobbyJoin } from './components/LobbyJoin';
import { InviteModal } from './components/InviteModal';
import { Room } from './components/Room';
import { Footer } from './components/Footer';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';

type Screen =
  | { view: 'home' }
  | { view: 'create' }
  | { view: 'join' }
  | { view: 'invite'; roomCode: string; displayName: string }
  | { view: 'room'; roomCode: string; peerId: string; displayName: string }
  | { view: 'terms' }
  | { view: 'privacy' };

function generatePeerId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const path = window.location.pathname;
    if (path === '/terms') return { view: 'terms' };
    if (path === '/privacy') return { view: 'privacy' };
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) return { view: 'join' };
    return { view: 'home' };
  });

  const [prefillCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('join') ?? '';
  });

  useEffect(() => {
    if (prefillCode) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [prefillCode]);

  if (screen.view === 'terms') return <TermsPage />;
  if (screen.view === 'privacy') return <PrivacyPage />;

  if (screen.view === 'room') {
    return (
      <Room
        roomCode={screen.roomCode}
        peerId={screen.peerId}
        displayName={screen.displayName}
        onLeave={() => setScreen({ view: 'home' })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      {screen.view === 'invite' && (
        <InviteModal
          roomCode={screen.roomCode}
          onDismiss={() =>
            setScreen({
              view: 'room',
              roomCode: screen.roomCode,
              peerId: generatePeerId(),
              displayName: screen.displayName,
            })
          }
        />
      )}

      {screen.view === 'home' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              switch<span className="text-accent">board</span>
            </h1>
            <p className="text-gray-400 text-sm">Plug in. Hang up. Gone.</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setScreen({ view: 'create' })}
              className="bg-accent hover:bg-accent-dim text-white font-semibold py-4 rounded-xl transition-colors text-lg"
            >
              Create Room
            </button>
            <button
              onClick={() => setScreen({ view: 'join' })}
              className="bg-white/5 hover:bg-white/10 text-white font-semibold py-4 rounded-xl transition-colors text-lg border border-white/10"
            >
              Join Room
            </button>
          </div>
          <p className="text-gray-600 text-xs text-center">
            No accounts. No servers. No persistence.
          </p>
          <Footer />
        </div>
      )}

      {screen.view === 'create' && (
        <LobbyCreate
          onCreated={(roomCode, displayName) =>
            setScreen({ view: 'invite', roomCode, displayName })
          }
          onBack={() => setScreen({ view: 'home' })}
        />
      )}

      {screen.view === 'join' && (
        <LobbyJoin
          initialCode={prefillCode}
          onJoin={(roomCode, displayName) =>
            setScreen({
              view: 'room',
              roomCode,
              peerId: generatePeerId(),
              displayName,
            })
          }
          onBack={() => setScreen({ view: 'home' })}
        />
      )}
    </div>
  );
}
