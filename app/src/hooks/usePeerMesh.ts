import { useState, useRef, useCallback, useEffect } from 'react';
import { createPeerConnection } from '../lib/peerConnection';
import type { SignalingActions } from './useSignaling';
import type { PeerInfo } from '../types';

export interface PeerMeshState {
  remoteStreams: Map<string, MediaStream>;
  peers: PeerInfo[];
  onPeerJoined: (peerId: string, displayName: string) => void;
  onPeerLeft: (peerId: string) => void;
  onSignal: (from: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit) => void;
  onRoomState: (existingPeers: PeerInfo[]) => void;
  replaceVideoTrack: (track: MediaStreamTrack) => void;
  addDataChannelHandler: (handler: (channel: RTCDataChannel, peerId: string) => void) => void;
}

export function usePeerMesh(
  localStream: MediaStream | null,
  _localPeerId: string,
  signaling: SignalingActions
): PeerMeshState {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peers, setPeers] = useState<PeerInfo[]>([]);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelHandlersRef = useRef<Array<(channel: RTCDataChannel, peerId: string) => void>>([]);
  const localStreamRef = useRef<MediaStream | null>(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const createPC = useCallback(
    (peerId: string, displayName: string): RTCPeerConnection => {
      const pc = createPeerConnection();
      pcsRef.current.set(peerId, pc);

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Remote tracks
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
        }
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signaling.sendSignal(peerId, event.candidate.toJSON());
        }
      };

      // DataChannel (for chat — created by offerer, handled by answerer via ondatachannel)
      pc.ondatachannel = (event) => {
        for (const handler of dataChannelHandlersRef.current) {
          handler(event.channel, peerId);
        }
      };

      setPeers((prev) => {
        if (prev.some((p) => p.peerId === peerId)) return prev;
        return [...prev, { peerId, displayName }];
      });

      return pc;
    },
    [signaling]
  );

  const onRoomState = useCallback(
    (existingPeers: PeerInfo[]) => {
      // We're the newcomer — existing peers will send us offers.
      // Just register them as known so we can answer.
      for (const peer of existingPeers) {
        if (!pcsRef.current.has(peer.peerId)) {
          createPC(peer.peerId, peer.displayName);
        }
      }
    },
    [createPC]
  );

  const onPeerJoined = useCallback(
    async (peerId: string, displayName: string) => {
      // We create the offer as the existing peer.
      const pc = createPC(peerId, displayName);

      // Create chat data channel on the offerer side
      const chatChannel = pc.createDataChannel('chat');
      for (const handler of dataChannelHandlersRef.current) {
        handler(chatChannel, peerId);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signaling.sendSignal(peerId, offer);
    },
    [createPC, signaling]
  );

  const onPeerLeft = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
    setPeers((prev) => prev.filter((p) => p.peerId !== peerId));
  }, []);

  const onSignal = useCallback(
    async (from: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit) => {
      const pc = pcsRef.current.get(from);
      if (!pc) return;

      if ('type' in payload && (payload.type === 'offer' || payload.type === 'answer')) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        if (payload.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.sendSignal(from, answer);
        }
      } else {
        // ICE candidate
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
        } catch {
          // Ignore stale candidates
        }
      }
    },
    [signaling]
  );

  const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
    for (const pc of pcsRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(track).catch(console.error);
      }
    }
  }, []);

  const addDataChannelHandler = useCallback(
    (handler: (channel: RTCDataChannel, peerId: string) => void) => {
      dataChannelHandlersRef.current.push(handler);
    },
    []
  );

  // Clean up all PCs on unmount
  useEffect(() => {
    return () => {
      for (const pc of pcsRef.current.values()) {
        pc.close();
      }
      pcsRef.current.clear();
    };
  }, []);

  return {
    remoteStreams,
    peers,
    onPeerJoined,
    onPeerLeft,
    onSignal,
    onRoomState,
    replaceVideoTrack,
    addDataChannelHandler,
  };
}
