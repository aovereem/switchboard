# Switchboard — Claude Code Project Spec

> Zero-infrastructure, peer-to-peer group communication. Voice, video, screenshare, and chat — no servers, no accounts, no persistence. Spin up a lobby, share a code, talk.

---

## Project Name: Switchboard

**Tagline:** _Plug in. Hang up. Gone._

---

## What This Is

Switchboard is a **hosted static web app** (Cloudflare Pages) that enables ephemeral peer-to-peer communication — voice, video, screenshare, and text chat — with no accounts, no persistent infrastructure, and no data at rest.

A user visits the URL, creates a room, gets a code like `DELTA-ECHO-4821`, and shares it via Discord/SMS/whatever. Their contact visits the same URL, enters the code, and they're connected P2P. When everyone closes the tab, nothing remains.

**There is no "download and run" flow. This is just a website.**

---

## Deployment Model

| Component | Where | How |
|---|---|---|
| **Frontend** | Cloudflare Pages | Auto-deploys from GitHub on push — free |
| **Signaling Worker** | Cloudflare Worker | `wrangler deploy` from `worker/` — free |
| **Media** | Peer-to-peer (WebRTC) | Never touches any server |

The frontend is a static Vite + React build. Cloudflare Pages serves it. The Cloudflare Worker handles WebSocket signaling only — it never processes audio, video, or chat. Both live in the same GitHub repo.

**Why not "download and open index.html"?** Browsers block `getUserMedia` (mic/cam) on `file://` URLs — requires `https://` or `localhost`. ES module imports also fail over `file://`. Cloudflare Pages solves both for free.

---

## Architecture Overview

```
Browser A ──── WebSocket (signaling only) ────► Cloudflare Worker
    │◄──────────── WebRTC P2P (audio/video/data) ──────────────►Browser B
    │◄──────────── WebRTC P2P (audio/video/data) ──────────────►Browser C
```

**Media flow:** Always direct peer-to-peer via WebRTC. The Worker only brokers the initial handshake (SDP offer/answer + ICE candidates). Once two peers are connected, the Worker is out of the picture for that pair.

**Topology:** Full mesh for ≤8 peers. Everyone connects to everyone directly.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript | Static SPA |
| Styling | Tailwind CSS | Dark theme default |
| Hosting | Cloudflare Pages | Free, auto-deploys from GitHub |
| Signaling | Cloudflare Worker + Durable Objects | Free tier, same repo |
| P2P | Native WebRTC | No library — browser API only |
| STUN | `stun.l.google.com:19302` | Free, no account |
| TURN | Optional, user-configurable via env | See config section |
| Chat | RTCDataChannel | Broadcast over mesh |
| Persistence | None | All state in memory, cleared on tab close |

---

## Repository Structure

```
switchboard/
├── app/                        # Frontend (Vite + React + TS)
│   ├── public/
│   │   └── _redirects          # CRITICAL: SPA routing for Cloudflare Pages
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── LobbyCreate.tsx
│   │   │   ├── LobbyJoin.tsx
│   │   │   ├── Room.tsx
│   │   │   ├── PeerTile.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ControlBar.tsx
│   │   │   └── InviteModal.tsx
│   │   ├── hooks/
│   │   │   ├── useSignaling.ts
│   │   │   ├── usePeerMesh.ts
│   │   │   ├── useLocalMedia.ts
│   │   │   └── useChat.ts
│   │   ├── lib/
│   │   │   ├── roomCode.ts
│   │   │   ├── peerConnection.ts
│   │   │   └── constants.ts
│   │   └── types/
│   │       └── index.ts
│   ├── .env.example            # Template — committed to repo
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── worker/                     # Cloudflare Worker (signaling only)
│   ├── src/
│   │   └── index.ts
│   ├── wrangler.toml
│   └── package.json
│
├── CLAUDE.md                   # ← This file
├── README.md
└── package.json                # Root — npm workspaces
```

---

## Build System — CRITICAL

This is an **npm workspaces** monorepo. The root `package.json` manages both `app` and `worker`.

### Root `package.json`

```json
{
  "name": "switchboard",
  "private": true,
  "workspaces": ["app", "worker"],
  "scripts": {
    "dev":            "npm run dev --workspace=app",
    "build":          "npm run build --workspace=app",
    "preview":        "npm run preview --workspace=app",
    "deploy:worker":  "npm run deploy --workspace=worker"
  }
}
```

### Correct build commands (always run from repo root)

```bash
npm install          # installs all workspaces
npm run dev          # local dev server at localhost:5173
npm run build        # production build → app/dist/
npm run preview      # preview the production build locally
npm run deploy:worker  # deploy signaling worker to Cloudflare
```

### ⚠️ Windows / workspace flag issue

If you previously ran `npm run build --workspace=app` directly and hit an error, use the root-level script instead. On Windows, npm workspace flag parsing can be inconsistent depending on npm version.

```bash
# ✅ Always works — use root scripts
npm run build

# ⚠️ May fail on Windows depending on npm version
npm run build --workspace=app

# ✅ Alternative direct workspace syntax if needed
npm run build -w app
```

If `npm run build` fails at the root, check:
1. You are in the repo root (where root `package.json` lives), not inside `app/`
2. Root `package.json` has the `"build": "npm run build --workspace=app"` script
3. `app/package.json` has a `"build": "vite build"` script
4. Run `npm install` from root first if `node_modules` is missing

### `app/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

---

## Cloudflare Pages Setup

### SPA Routing — `app/public/_redirects`

**This file must exist or direct links to `/room/CODE` will 404.**

```
/*    /index.html   200
```

Vite copies everything in `public/` to `dist/` automatically, so this file lands in the right place after build.

### Cloudflare Pages Dashboard Config

```
Framework preset:       None
Build command:          npm run build
Build output directory: app/dist
Root directory:         /  (repo root — do NOT set to /app)
```

### Environment Variables (set in Pages dashboard)

```
VITE_SIGNALING_URL = wss://switchboard-signal.YOUR_SUBDOMAIN.workers.dev
```

---

## Room Code Architecture

### Format: `WORD-WORD-####`

Examples: `DELTA-ECHO-4821`, `TIGER-NOVA-0037`

- Two words from a curated ~256-word list
- 4-digit numeric suffix (0000–9999)
- 655 million combinations total
- Human-readable, easy to dictate verbally
- Short enough to type

### `app/src/lib/roomCode.ts`

```typescript
const WORDS = [
  'ALPHA','BRAVO','DELTA','ECHO','FOXTROT','GOLF','HOTEL','INDIA',
  'JULIET','KILO','LIMA','MIKE','NOVA','OSCAR','PAPA','ROMEO','SIERRA',
  'TANGO','ULTRA','VICTOR','WHISKY','XRAY','YANKEE','ZULU','AMBER','AZURE',
  'CEDAR','CORAL','CRANE','EMBER','FLINT','FROST','GROVE','HAVEN','IVORY',
  'JADE','LUNAR','MAPLE','MARSH','ONYX','ORBIT','PINE','RAVEN','RIDGE',
  'RIVER','ROBIN','ROCKY','SABLE','SOLAR','STONE','STORM','SWIFT',
  'TIGER','TITAN','VALE','VIPER','VISTA','WOLF','WREN',
  // extend to ~256 entries
];

export function generateRoomCode(): string {
  const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${w1}-${w2}-${pin}`;
}

export const ROOM_CODE_REGEX = /^[A-Z]{4,6}-[A-Z]{4,6}-\d{4}$/;

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_REGEX.test(code.toUpperCase().trim());
}

export function formatRoomCode(raw: string): string {
  return raw.toUpperCase().trim();
}
```

---

## Signaling Protocol

All messages are JSON over WebSocket. Worker only relays — never interprets media.

### Client → Worker

```typescript
{ type: 'join',   roomCode: string, peerId: string, displayName: string }
{ type: 'signal', to: string, from: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit }
{ type: 'leave',  roomCode: string, peerId: string }
```

### Worker → Client

```typescript
{ type: 'peer-joined', peerId: string, displayName: string }
{ type: 'signal',      from: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit }
{ type: 'peer-left',   peerId: string }
{ type: 'room-state',  peers: Array<{ peerId: string, displayName: string }> }
{ type: 'error',       code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' }
```

---

## WebRTC Peer Connection Flow

```
Host creates room → generates roomCode → opens WS → Worker creates DO

Guest joins → opens WS → sends 'join'
  → Worker sends 'room-state' to guest + 'peer-joined' to all others

For each existing peer that receives 'peer-joined':
  → Creates RTCPeerConnection with ICE_SERVERS
  → Creates SDP offer → sends via Worker signal
  → Guest receives offer → creates answer → sends back
  → ICE candidates exchange via Worker
  → Direct P2P established — Worker no longer in the loop
```

---

## Hook Contracts

### `useSignaling(roomCode, peerId)`
- Opens `wss://{SIGNALING_URL}?room={roomCode}&peer={peerId}&name={displayName}`
- Callbacks: `onPeerJoined`, `onPeerLeft`, `onSignal`, `onRoomState`, `onError`
- Actions: `sendSignal(to, payload)`, `sendLeave()`
- Auto-reconnects: exponential backoff, max 5 retries

### `usePeerMesh(signaling, localStream)`
- `Map<peerId, RTCPeerConnection>` — one connection per remote peer
- On `onPeerJoined` → create PC → add local tracks → create offer → send
- On `onSignal` → handle offer/answer/ICE candidate
- On screenshare: `replaceTrack` on all connections (no renegotiation)
- Exposes: `remoteStreams: Map<peerId, MediaStream>`, `peers: PeerInfo[]`

### `useLocalMedia()`
- `getUserMedia({ audio: true, video: true })`
- `toggleMic()` — sets `track.enabled`, does NOT stop stream
- `toggleCam()` — sets `track.enabled`
- `startScreenshare()` → `getDisplayMedia()` → replaces video track on all PCs
- `stopScreenshare()` → reverts to cam track
- Exposes: `localStream`, `micEnabled`, `camEnabled`, `isScreensharing`

### `useChat(peerMesh)`
- `RTCDataChannel('chat')` created on each peer connection
- `send(text)` → iterates all open channels, sends `JSON.stringify({ from, text, timestamp })`
- Exposes: `messages: ChatMessage[]`, `send(text: string)`

---

## Worker Implementation

### `worker/package.json`

```json
{
  "name": "switchboard-worker",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "@cloudflare/workers-types": "^4.0.0"
  }
}
```

### `worker/wrangler.toml`

```toml
name = "switchboard-signal"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "ROOMS"
class_name = "Room"

[[migrations]]
tag = "v1"
new_classes = ["Room"]
```

### `worker/src/index.ts` — full implementation

```typescript
export interface Env {
  ROOMS: DurableObjectNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    // POST /room → create room, return code
    if (request.method === 'POST' && url.pathname === '/room') {
      const roomCode = generateRoomCode();
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomCode));
      await stub.fetch(new Request('https://internal/init'));
      return new Response(JSON.stringify({ roomCode }), {
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    // WebSocket → route to Room Durable Object
    if (request.headers.get('Upgrade') === 'websocket') {
      const roomCode = url.searchParams.get('room');
      if (!roomCode) return new Response('Missing room', { status: 400 });
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomCode));
      return stub.fetch(request);
    }

    return new Response('Switchboard OK', { headers: CORS });
  }
};

export class Room {
  private sessions = new Map<string, { ws: WebSocket; displayName: string }>();
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/init') return new Response('OK');

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const peerId = url.searchParams.get('peer') ?? crypto.randomUUID();
    const displayName = url.searchParams.get('name') ?? 'Anonymous';

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server);

    // Send room state to the new peer
    const peers = [...this.sessions.entries()].map(([id, s]) => ({
      peerId: id,
      displayName: s.displayName
    }));
    server.send(JSON.stringify({ type: 'room-state', peers }));

    // Notify existing peers
    this.broadcast(peerId, { type: 'peer-joined', peerId, displayName });

    this.sessions.set(peerId, { ws: server, displayName });

    server.addEventListener('message', (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data as string);
        if (msg.type === 'signal' && msg.to) {
          this.sessions.get(msg.to)?.ws.send(
            JSON.stringify({ type: 'signal', from: peerId, payload: msg.payload })
          );
        }
        if (msg.type === 'leave') this.handleLeave(peerId);
      } catch {}
    });

    server.addEventListener('close', () => this.handleLeave(peerId));
    server.addEventListener('error', () => this.handleLeave(peerId));

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleLeave(peerId: string) {
    if (!this.sessions.has(peerId)) return;
    this.sessions.delete(peerId);
    this.broadcast(peerId, { type: 'peer-left', peerId });
  }

  private broadcast(excludeId: string, msg: object) {
    const json = JSON.stringify(msg);
    for (const [id, { ws }] of this.sessions) {
      if (id !== excludeId) {
        try { ws.send(json); } catch {}
      }
    }
  }
}

function generateRoomCode(): string {
  const words = ['ALPHA','BRAVO','DELTA','ECHO','FOXTROT','GOLF','HOTEL',
    'JULIET','KILO','LIMA','MIKE','NOVA','OSCAR','ROMEO','SIERRA','TANGO',
    'ULTRA','VICTOR','WHISKY','YANKEE','ZULU','AMBER','AZURE','CEDAR',
    'CORAL','EMBER','FLINT','FROST','GROVE','IVORY','JADE','LUNAR',
    'MAPLE','ONYX','ORBIT','PINE','RAVEN','RIDGE','RIVER','SABLE',
    'SOLAR','STONE','STORM','SWIFT','TIGER','TITAN','VALE','VIPER',
    'VISTA','WOLF','WREN'];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${w1}-${w2}-${pin}`;
}
```

---

## Environment / Config

### `app/src/lib/constants.ts`

```typescript
export const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL as string
  ?? 'wss://switchboard-signal.YOUR_SUBDOMAIN.workers.dev';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL ? [{
    urls: import.meta.env.VITE_TURN_URL as string,
    username: import.meta.env.VITE_TURN_USER as string,
    credential: import.meta.env.VITE_TURN_PASS as string,
  }] : [])
];

export const MAX_PEERS = 8;
```

### `app/.env.example` (commit this)

```
VITE_SIGNALING_URL=wss://switchboard-signal.YOUR_SUBDOMAIN.workers.dev
# Optional TURN for strict NAT:
# VITE_TURN_URL=turn:your-server.com:3478
# VITE_TURN_USER=username
# VITE_TURN_PASS=password
```

---

## UI / UX Spec

### Screens

**1. Home (`/`)**
- Two CTA buttons: "Create Room" and "Join Room"
- Optional display name input (defaults to random adjective+noun, e.g. "Swift Raccoon")
- Dark, minimal — game lobby aesthetic

**2. Waiting Room (`/room/:code` — before others join)**
- Room code large in monospace — click to copy
- Instruction: "Share this code with anyone you want to join"
- Copy Code + Copy Link buttons (link = `https://switchboard.pages.dev/?join=CODE`)
- Local video preview (muted locally)

**3. Active Room (`/room/:code` — with peers)**
- Peer tiles in CSS Grid (auto-fill columns, 16:9 aspect ratio)
- ControlBar: mic, cam, screenshare, chat toggle, leave
- ChatPanel: slides in from right, overlay — does not resize grid
- Speaking indicator: animated border ring on active tile
- Screenshare: large main area + small cam strip on right

### Deep Link

`https://switchboard.pages.dev/?join=DELTA-ECHO-4821` — pre-fills join form, focuses display name field.

### Visual Design

| Token | Value | Usage |
|---|---|---|
| Background | `#0f0f13` | App background |
| Surface | `#1a1a24` | Cards, panels |
| Accent | `#7c6fff` | Buttons, focus rings, active states |
| Text primary | `#e0dfff` | Body copy |
| Text secondary | `#9999bb` | Timestamps, hints |
| Danger | `#ff5f5f` | Leave button, errors |

---

## MVP Scope

**Ship first:**
- Room creation + code generation
- Join by code + deep link support (`?join=CODE`)
- Voice (always on, toggleable mute)
- Video (toggleable)
- Screenshare
- Text chat via DataChannel
- Peer join/leave with visual feedback
- `beforeunload` sends leave signal

**Post-MVP:**
- QR code invite
- Noise suppression (RNNoise WASM)
- Emoji reactions (DataChannel broadcast)
- Optional room PIN
- TURN server UI config
- Mobile polish

---

## Known Constraints

1. **NAT traversal** — STUN works ~80% of the time. Symmetric NAT (some corporate/mobile networks) needs TURN. Document this, don't over-promise.
2. **Mesh scaling** — 8 peers = 28 total connections. Fine for voice. 8-way 720p video is heavy.
3. **Tab close = leave** — `beforeunload` is best-effort. Peers self-heal via ICE timeout (~5s).
4. **HTTPS is automatic** — Cloudflare Pages serves HTTPS, so `getUserMedia` works. This is the main reason Pages beats self-hosting.
5. **Cloudflare free tier** — 100k requests/day, Durable Objects included. Fine for personal/small-team use.

---

## Notes for Claude Code

- **No WebRTC libraries** — native `RTCPeerConnection` only. No SimplePeer, no PeerJS.
- **All state ephemeral** — nothing in `localStorage`, `IndexedDB`, or any persistent store.
- **TypeScript strict mode** — no `any` without a comment explaining why.
- **Mobile is stretch goal** — optimize for desktop Chrome/Firefox/Edge first.
- **The only thing that deploys** is the Worker (`wrangler deploy`) and Pages (GitHub push). There is no backend to manage.
