# Switchboard — Implementation Tasks

Work through phases in order. Each is a logical commit unit.

> **Current status:** Build system scaffolded. Hit an error on `npm run build --workspace=app`.
> See Phase 1 fix below before continuing.

---

## 🔧 Immediate Fix — Build Error

The error on `cd E:/dev/switchboard && npm run build --workspace=app` is likely one of:

**Fix A — Wrong directory or missing root script**

Ensure the root `package.json` (at `E:/dev/switchboard/package.json`) has:

```json
{
  "name": "switchboard",
  "private": true,
  "workspaces": ["app", "worker"],
  "scripts": {
    "dev":           "npm run dev --workspace=app",
    "build":         "npm run build --workspace=app",
    "preview":       "npm run preview --workspace=app",
    "deploy:worker": "npm run deploy --workspace=worker"
  }
}
```

Then run from repo root:
```bash
npm run build
```
Not `npm run build --workspace=app` — let the root script handle the routing.

**Fix B — app/package.json missing build script**

Ensure `app/package.json` has:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Fix C — node_modules out of sync**

```bash
# From repo root
rm -rf node_modules app/node_modules worker/node_modules
npm install
npm run build
```

**Fix D — TypeScript errors blocking build**

If `tsc` fails, check for type errors in src/. Common ones:
- Missing types for `import.meta.env` → add `/// <reference types="vite/client" />` to `vite-env.d.ts`
- Implicit `any` in hook params → add explicit types

---

## Phase 1: Scaffold ✅ (partially done — fix build then continue)

- [ ] Verify root `package.json` has correct workspace + scripts config (see fix above)
- [ ] Verify `app/package.json` has `dev`, `build`, `preview` scripts
- [ ] Verify `worker/package.json` has `dev`, `deploy` scripts
- [ ] `npm run build` from root succeeds → `app/dist/` is generated
- [ ] Create `app/public/_redirects` with content: `/*    /index.html   200`
      (Required for SPA routing on Cloudflare Pages — without this, direct links 404)
- [ ] Create `app/.env.example` (see CLAUDE.md Environment section)
- [ ] Add `app/.env.local` to `.gitignore`
- [ ] Remove `scripts/launch.sh` and `scripts/launch.bat` — not needed (app is hosted, not local)

---

## Phase 2: Room Code System

- [ ] Create `app/src/lib/roomCode.ts` (see full implementation in CLAUDE.md)
  - Word list: ~60 entries minimum, extend toward 256
  - `generateRoomCode()` → `WORD-WORD-####`
  - `isValidRoomCode(code)` → boolean
  - `formatRoomCode(code)` → uppercase normalized

---

## Phase 3: Signaling Worker

- [ ] Implement `worker/src/index.ts` — full skeleton in CLAUDE.md, copy it verbatim
- [ ] Verify `worker/wrangler.toml` has Durable Object binding (see CLAUDE.md)
- [ ] Test locally: `npm run dev --workspace=worker` (or `cd worker && npx wrangler dev`)
- [ ] Deploy: `npm run deploy:worker` from repo root
- [ ] Note the deployed Worker URL (e.g. `wss://switchboard-signal.YOUR.workers.dev`)
- [ ] Add that URL as `VITE_SIGNALING_URL` in `app/.env.local`

---

## Phase 4: Frontend Hooks

Build independently, in this order:

- [ ] **`app/src/lib/constants.ts`**
  - `SIGNALING_URL` from `import.meta.env.VITE_SIGNALING_URL`
  - `ICE_SERVERS` array with Google STUN + optional TURN from env
  - `MAX_PEERS = 8`

- [ ] **`useLocalMedia.ts`**
  - `getUserMedia({ audio: true, video: true })`
  - `toggleMic()` — `track.enabled = !enabled`, does NOT stop stream
  - `toggleCam()` — same pattern
  - `startScreenshare()` — `getDisplayMedia()`, replaces video track via `replaceTrack`
  - `stopScreenshare()` — reverts to cam track
  - Expose: `localStream`, `micEnabled`, `camEnabled`, `isScreensharing`

- [ ] **`useSignaling.ts`**
  - Connect to `wss://{SIGNALING_URL}?room={roomCode}&peer={peerId}&name={displayName}`
  - Handle reconnection: exponential backoff, max 5 retries
  - Callbacks: `onPeerJoined`, `onPeerLeft`, `onSignal`, `onRoomState`, `onError`
  - Actions: `sendSignal(to, payload)`, `sendLeave()`

- [ ] **`usePeerMesh.ts`**
  - `Map<peerId, RTCPeerConnection>`
  - On `onPeerJoined` → create PC with `ICE_SERVERS` → add local tracks → create offer → send
  - On `onSignal` → route to correct PC: handle offer/answer/ICE candidate
  - On screenshare: `sender.replaceTrack(newTrack)` on all connections
  - Expose: `remoteStreams: Map<peerId, MediaStream>`, `peers: PeerInfo[]`

- [ ] **`useChat.ts`**
  - Create `RTCDataChannel('chat', { ordered: true })` on each PC
  - `send(text)`: iterate all open channels, `ch.send(JSON.stringify({ from, text, timestamp }))`
  - Expose: `messages: ChatMessage[]`, `send(text: string)`

---

## Phase 5: UI Components

Build in this order:

- [ ] **`App.tsx`** — Router setup
  - Install: `npm install react-router-dom --workspace=app`
  - `/` → Home screen
  - `/room/:code` → Room
  - `/?join=CODE` → pre-fill join form

- [ ] **`LobbyCreate.tsx`**
  - Display name input (optional, random default)
  - "Create Room" button → `POST {SIGNALING_URL}/room` → navigate to `/room/:code`

- [ ] **`LobbyJoin.tsx`**
  - Room code input: auto-uppercase, auto-insert dashes as user types
  - Real-time validation via `isValidRoomCode`
  - "Join" button → navigate to `/room/:code`

- [ ] **`InviteModal.tsx`**
  - Shown immediately after room creation (before others join)
  - Room code in large monospace — click to copy
  - Copy Code + Copy Link buttons
  - Link format: `https://switchboard.pages.dev/?join=CODE`
  - Dismiss enters the room

- [ ] **`PeerTile.tsx`**
  - Props: `stream`, `displayName`, `isMuted`, `isSpeaking`
  - `<video autoPlay playsInline>` bound to stream
  - Avatar placeholder when cam off
  - Speaking indicator: `box-shadow` or `border` ring animation
  - Name badge overlay (bottom-left)

- [ ] **`ControlBar.tsx`**
  - Mic toggle: MicIcon / MicOffIcon (lucide-react)
  - Cam toggle: VideoIcon / VideoOffIcon
  - Screenshare: MonitorIcon / MonitorOffIcon
  - Chat: MessageSquareIcon with unread badge
  - Leave: PhoneOffIcon, red, confirm on click → navigate `/`
  - Auto-hide after 3s inactivity, reappear on mousemove

- [ ] **`ChatPanel.tsx`**
  - Slide in from right (CSS transform + transition)
  - Overlay — does not resize peer grid
  - Message list: sender name, text, timestamp
  - Input at bottom, send on Enter
  - Auto-scroll to latest message

- [ ] **`Room.tsx`** — Main composition
  - Composes: `useSignaling`, `usePeerMesh`, `useLocalMedia`, `useChat`
  - Peer grid: CSS Grid `repeat(auto-fill, minmax(320px, 1fr))`
  - Screenshare layout: flex row, large main + 160px sidebar
  - Wire `ControlBar` actions to hook methods
  - `window.addEventListener('beforeunload', () => signaling.sendLeave())`
  - Show `InviteModal` on initial load if peer count is 0

---

## Phase 6: Polish

- [ ] Speaking detection
  - Web Audio API: `AudioContext → createAnalyser → getByteFrequencyData`
  - Threshold + debounce (~200ms) to set `isSpeaking` on `PeerInfo`
  - Apply to both local and remote streams

- [ ] Connection state per peer
  - `RTCPeerConnection.connectionState` → 'connecting' | 'connected' | 'reconnecting' | 'failed'
  - Visual indicator on `PeerTile` (subtle overlay or icon)

- [ ] Error states
  - Room not found → friendly message + link to create one
  - Mic/cam permission denied → instructions to allow + retry button
  - Browser not supported (no WebRTC) → message with Chrome/Firefox link

- [ ] Toast notifications
  - Peer joined/left announcements (bottom of screen, auto-dismiss 3s)
  - Copy confirmation ("Copied!")
  - Use a simple custom toast, not a library

---

## Phase 7: Deploy + Verify

- [ ] Deploy Worker: `npm run deploy:worker`
- [ ] Add Worker URL to Cloudflare Pages env vars as `VITE_SIGNALING_URL`
- [ ] Push to GitHub → Cloudflare Pages auto-builds
- [ ] Verify `_redirects` is in build output (`app/dist/_redirects`)
- [ ] Test: create room on device A, join on device B (different networks if possible)
- [ ] Test screenshare, chat, peer leave
- [ ] Verify tab close cleans up (other peer sees peer-left within ~5s)

---

## Phase 8: README

- [ ] Update README with final Pages URL
- [ ] Document NAT traversal limitation clearly
- [ ] Document how to deploy your own instance (fork → Pages + Worker)
- [ ] Add screenshot or GIF

---

## Notes for Claude Code

- **No WebRTC libraries** — native `RTCPeerConnection` only
- **No persistence** — nothing in `localStorage`, `IndexedDB`, or any store
- **TypeScript strict mode** — no untyped `any`
- **Mobile is stretch** — desktop Chrome/Firefox/Edge first
- **The hosted URL is the product** — no install, no download, just a link
- **HTTPS is automatic** via Cloudflare Pages — `getUserMedia` works out of the box
- See CLAUDE.md for full architecture, message schemas, hook contracts, visual spec, and complete Worker implementation
