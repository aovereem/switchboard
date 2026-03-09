export const SIGNALING_URL =
  (import.meta.env.VITE_SIGNALING_URL as string | undefined) ??
  'wss://switchboard-signal.YOUR_SUBDOMAIN.workers.dev';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_URL as string,
          username: import.meta.env.VITE_TURN_USER as string,
          credential: import.meta.env.VITE_TURN_PASS as string,
        },
      ]
    : []),
];

export const MAX_PEERS = 8;
