import { useEffect, useRef, useCallback } from 'react';
import { SIGNALING_URL } from '../lib/constants';
import type { SignalingMessage, PeerInfo } from '../types';

export interface SignalingHandlers {
  onRoomState: (peers: PeerInfo[]) => void;
  onPeerJoined: (peerId: string, displayName: string) => void;
  onPeerLeft: (peerId: string) => void;
  onSignal: (from: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit) => void;
  onError: (code: 'ROOM_NOT_FOUND' | 'ROOM_FULL') => void;
}

export interface SignalingActions {
  sendSignal: (to: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit) => void;
  sendLeave: () => void;
}

export function useSignaling(
  roomCode: string,
  peerId: string,
  displayName: string,
  handlers: SignalingHandlers
): SignalingActions {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const wsUrl = `${SIGNALING_URL}?room=${encodeURIComponent(roomCode)}&peer=${encodeURIComponent(peerId)}&name=${encodeURIComponent(displayName)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      let msg: SignalingMessage;
      try {
        msg = JSON.parse(event.data as string) as SignalingMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case 'room-state':
          handlersRef.current.onRoomState(msg.peers);
          break;
        case 'peer-joined':
          handlersRef.current.onPeerJoined(msg.peerId, msg.displayName);
          break;
        case 'peer-left':
          handlersRef.current.onPeerLeft(msg.peerId);
          break;
        case 'signal':
          handlersRef.current.onSignal(msg.from, msg.payload as RTCSessionDescriptionInit | RTCIceCandidateInit);
          break;
        case 'error':
          handlersRef.current.onError(msg.code);
          break;
      }
    };

    ws.onclose = (event) => {
      if (event.wasClean) return;
      // Exponential backoff reconnect (max 5 retries)
      if (retryCountRef.current < 5) {
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000);
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(connect, delay);
      }
    };
  }, [roomCode, peerId, displayName]);

  useEffect(() => {
    connect();
    return () => {
      retryTimerRef.current && clearTimeout(retryTimerRef.current);
      wsRef.current?.close(1000, 'Component unmounted');
    };
  }, [connect]);

  const sendSignal = useCallback(
    (to: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit) => {
      wsRef.current?.send(
        JSON.stringify({ type: 'signal', to, from: peerId, payload })
      );
    },
    [peerId]
  );

  const sendLeave = useCallback(() => {
    wsRef.current?.send(
      JSON.stringify({ type: 'leave', roomCode, peerId })
    );
    wsRef.current?.close(1000, 'Left room');
  }, [roomCode, peerId]);

  return { sendSignal, sendLeave };
}
