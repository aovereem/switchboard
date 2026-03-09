export interface PeerInfo {
  peerId: string;
  displayName: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  displayName: string;
  text: string;
  timestamp: number;
}

export type SignalingMessage =
  | { type: 'room-state'; peers: PeerInfo[] }
  | { type: 'peer-joined'; peerId: string; displayName: string }
  | { type: 'peer-left'; peerId: string }
  | { type: 'signal'; from: string; payload: RTCSessionDescriptionInit | RTCIceCandidateInit }
  | { type: 'error'; code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' };

export type ClientMessage =
  | { type: 'join'; roomCode: string; peerId: string; displayName: string }
  | { type: 'signal'; to: string; from: string; payload: RTCSessionDescriptionInit | RTCIceCandidateInit }
  | { type: 'leave'; roomCode: string; peerId: string };
