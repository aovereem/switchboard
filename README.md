# Switchboard

**Plug in. Hang up. Gone.**

P2P voice, video, screenshare, and chat — directly in your browser. No accounts. No downloads. No logs. Create a room, share a code, talk. Close the tab and it never existed.

---

## Use It

1. Click **Create Room** — get a code like `DELTA-ECHO-4821`
2. Send the code (Discord, SMS, whatever)
3. Your contact visits the same link, clicks **Join Room**, enters the code
4. Connected — voice, video, chat, screenshare, all direct P2P
5. Close the tab — session gone

---

## How It Works

Audio/video/screen data travels directly between browsers via WebRTC — it never touches a server. A small Cloudflare Worker handles only the initial connection handshake (exchanging WebRTC session descriptions), then gets out of the way entirely.

Room codes are ephemeral. Chat is cached in browser memory only. Nothing is stored anywhere.

---

## Deploy Your Own Instance

Fork this repo, then:

**1. Deploy the signaling Worker**
```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
# Note your worker URL: wss://switchboard-signal.YOUR.workers.dev
```

**2. Connect to Cloudflare Pages**
- Push your fork to GitHub
- Cloudflare Dashboard → Pages → Create project → Connect to Git
- Build settings:
  - Build command: `npm run build`
  - Output directory: `app/dist`
  - Root directory: `/`
- Environment variable: `VITE_SIGNALING_URL` = your Worker URL from step 1

That's it. Cloudflare Pages auto-deploys on every push.

---

## NAT Traversal

Works for most connections (~80%) using Google's free STUN servers. If you or a peer are on a restrictive corporate or mobile network, you may need a TURN relay server.

Add to your Pages environment variables:
```
VITE_TURN_URL=turn:your-turn-server.com:3478
VITE_TURN_USER=username
VITE_TURN_PASS=password
```

Free TURN option: [Open Relay by Metered](https://www.metered.ca/tools/openrelay/) (rate limited).
Self-host: [coturn](https://github.com/coturn/coturn).

---

## Limits

- Up to **8 peers** per room
- Rooms close permanently when the last person leaves — codes are one-use
- For large groups, recommend turning cameras off — 8-way video is bandwidth-heavy

---

## Privacy

- No accounts, no cookies, no tracking
- Audio/video/screen never passes through any server — always peer-to-peer
- Chat messages exist only in browser memory, cleared when tab closes
- The signaling Worker only sees: anonymous peer IDs and WebRTC handshake data — never media

---

## Stack

WebRTC · Cloudflare Workers + Durable Objects · Cloudflare Pages · Vite · React · TypeScript · Tailwind
