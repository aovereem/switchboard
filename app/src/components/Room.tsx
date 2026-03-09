import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useSignaling } from '../hooks/useSignaling';
import { usePeerMesh } from '../hooks/usePeerMesh';
import { useChat } from '../hooks/useChat';
import { PeerTile } from './PeerTile';
import { ControlBar } from './ControlBar';
import { ChatPanel } from './ChatPanel';

interface Props {
  roomCode: string;
  peerId: string;
  displayName: string;
  onLeave: () => void;
}

export function Room({ roomCode, peerId, displayName, onLeave }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  const media = useLocalMedia();
  const chat = useChat(peerId, displayName);

  // We need signaling actions before peer mesh, but peer mesh handlers go into signaling.
  // Solve with refs to break the circular dep.
  const meshRef = useRef<ReturnType<typeof usePeerMesh> | null>(null);

  const signalingHandlers = useMemo(
    () => ({
      onRoomState: (peers: { peerId: string; displayName: string }[]) =>
        meshRef.current?.onRoomState(peers),
      onPeerJoined: (pid: string, name: string) => meshRef.current?.onPeerJoined(pid, name),
      onPeerLeft: (pid: string) => meshRef.current?.onPeerLeft(pid),
      onSignal: (
        from: string,
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit
      ) => meshRef.current?.onSignal(from, payload),
      onError: (code: 'ROOM_NOT_FOUND' | 'ROOM_FULL') => {
        console.error('Signaling error:', code);
        if (code === 'ROOM_NOT_FOUND') onLeave();
      },
    }),
    [onLeave]
  );

  const signaling = useSignaling(roomCode, peerId, displayName, signalingHandlers);
  const mesh = usePeerMesh(media.localStream, peerId, signaling);
  meshRef.current = mesh;

  // Register chat data channels
  useEffect(() => {
    mesh.addDataChannelHandler(chat.registerChannel);
  }, [mesh, chat]);

  // Replace video track on all PCs when screenshare starts/stops
  useEffect(() => {
    if (media.localStream) {
      const videoTrack = media.localStream.getVideoTracks()[0];
      if (videoTrack) {
        mesh.replaceVideoTrack(videoTrack);
      }
    }
  }, [media.localStream, mesh]);

  // beforeunload: send leave
  useEffect(() => {
    const handler = () => signaling.sendLeave();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [signaling]);

  // Unread badge
  useEffect(() => {
    if (!chatOpen) {
      setSeenCount(chat.messages.length - (chat.messages.length - seenCount));
    } else {
      setSeenCount(chat.messages.length);
    }
  }, [chat.messages, chatOpen]);

  const unreadCount = chatOpen ? 0 : Math.max(0, chat.messages.length - seenCount);

  function handleLeave() {
    signaling.sendLeave();
    onLeave();
  }

  function handleToggleScreenshare() {
    if (media.isScreensharing) {
      media.stopScreenshare();
    } else {
      media.startScreenshare().catch(console.error);
    }
  }

  const allPeerTiles = [
    // Local tile
    <PeerTile
      key="local"
      stream={media.localStream}
      displayName={displayName}
      isMuted={!media.micEnabled}
      isSpeaking={false}
      isLocal
    />,
    // Remote tiles
    ...mesh.peers.map((peer) => (
      <PeerTile
        key={peer.peerId}
        stream={mesh.remoteStreams.get(peer.peerId) ?? null}
        displayName={peer.displayName}
        isMuted={false}
        isSpeaking={false}
      />
    )),
  ];

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-accent font-bold text-lg tracking-tight">switchboard</span>
          <span className="text-gray-500 text-sm">·</span>
          <span className="font-mono text-sm text-gray-300 tracking-wider">{roomCode}</span>
        </div>
        <span className="text-gray-500 text-xs">
          {mesh.peers.length + 1} {mesh.peers.length + 1 === 1 ? 'person' : 'people'}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Peer grid */}
        <div className="flex-1 p-4 overflow-auto">
          {mesh.peers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center animate-pulse">
                <span className="text-4xl">📡</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Waiting for others…</p>
                <p className="text-gray-400 text-sm mt-1">
                  Share the room code: <span className="font-mono text-accent">{roomCode}</span>
                </p>
              </div>
              {/* Local preview */}
              <div className="w-64">
                <PeerTile
                  stream={media.localStream}
                  displayName={displayName}
                  isMuted={!media.micEnabled}
                  isSpeaking={false}
                  isLocal
                />
              </div>
            </div>
          ) : (
            <div
              className="grid gap-3 h-full"
              style={{
                gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(allPeerTiles.length))}, 1fr)`,
                gridAutoRows: '1fr',
              }}
            >
              {allPeerTiles}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <ChatPanel
            messages={chat.messages}
            onSend={chat.send}
            onClose={() => setChatOpen(false)}
            localPeerId={peerId}
          />
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        micEnabled={media.micEnabled}
        camEnabled={media.camEnabled}
        isScreensharing={media.isScreensharing}
        chatOpen={chatOpen}
        unreadCount={unreadCount}
        onToggleMic={media.toggleMic}
        onToggleCam={media.toggleCam}
        onToggleScreenshare={handleToggleScreenshare}
        onToggleChat={() => {
          setChatOpen((v) => !v);
          setSeenCount(chat.messages.length);
        }}
        onLeave={handleLeave}
      />
    </div>
  );
}
