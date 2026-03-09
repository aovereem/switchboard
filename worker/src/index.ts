/**
 * Switchboard Signaling Worker
 * Cloudflare Worker + Durable Objects
 *
 * Routes:
 *   POST /room   → generate + return { roomCode }, init Room DO
 *   WS   /?room=CODE&peer=ID&name=NAME  → join room via WebSocket
 */

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

    // POST /room → generate room code, init DO, return code
    if (request.method === 'POST' && url.pathname === '/room') {
      const roomCode = generateRoomCode();
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomCode));
      await stub.fetch(new Request('https://internal/init'));
      return new Response(JSON.stringify({ roomCode }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // WebSocket upgrade → route to Room Durable Object
    if (request.headers.get('Upgrade') === 'websocket') {
      const roomCode = url.searchParams.get('room');
      if (!roomCode) return new Response('Missing room', { status: 400 });
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomCode));
      return stub.fetch(request);
    }

    return new Response('Switchboard OK', { status: 200, headers: CORS });
  },
};

// ─── Room Durable Object ────────────────────────────────────────────────────

export class Room {
  private sessions = new Map<string, { ws: WebSocket; displayName: string }>();

  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal init — touch the DO to create it
    if (url.pathname === '/init') return new Response('OK');

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const peerId = url.searchParams.get('peer') ?? crypto.randomUUID();
    const displayName = url.searchParams.get('name') ?? 'Anonymous';

    if (this.sessions.size >= 8) {
      const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
      server.accept();
      server.send(JSON.stringify({ type: 'error', code: 'ROOM_FULL' }));
      server.close(1008, 'Room full');
      return new Response(null, { status: 101, webSocket: client });
    }

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server, [peerId]);

    // Send current room state to the newcomer
    const peers = [...this.sessions.entries()].map(([id, s]) => ({
      peerId: id,
      displayName: s.displayName,
    }));
    server.send(JSON.stringify({ type: 'room-state', peers }));

    // Notify existing peers
    this.broadcast(peerId, { type: 'peer-joined', peerId, displayName });

    this.sessions.set(peerId, { ws: server, displayName });

    return new Response(null, { status: 101, webSocket: client });
  }

  // Called by Cloudflare runtime for hibernatable WebSocket messages
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const tags = this.state.getTags(ws);
    const peerId = tags[0];
    if (!peerId) return;

    let msg: { type: string; to?: string; payload?: unknown };
    try {
      msg = JSON.parse(message as string) as typeof msg;
    } catch {
      return;
    }

    if (msg.type === 'signal' && msg.to) {
      const target = this.sessions.get(msg.to);
      if (target) {
        target.ws.send(JSON.stringify({ type: 'signal', from: peerId, payload: msg.payload }));
      }
    } else if (msg.type === 'leave') {
      this.handleLeave(peerId);
    }
  }

  // Called by Cloudflare runtime on WebSocket close/error
  async webSocketClose(ws: WebSocket) {
    const tags = this.state.getTags(ws);
    const peerId = tags[0];
    if (peerId) this.handleLeave(peerId);
  }

  async webSocketError(ws: WebSocket) {
    const tags = this.state.getTags(ws);
    const peerId = tags[0];
    if (peerId) this.handleLeave(peerId);
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
        try {
          ws.send(json);
        } catch {
          // socket already closed
        }
      }
    }
  }
}

// ─── Room code generation (server-side) ─────────────────────────────────────

const WORDS = [
  'ALPHA', 'BRAVO', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL',
  'JULIET', 'KILO', 'LIMA', 'MIKE', 'NOVA', 'OSCAR', 'ROMEO', 'SIERRA',
  'TANGO', 'ULTRA', 'VICTOR', 'WHISKY', 'YANKEE', 'ZULU', 'AMBER', 'AZURE',
  'CEDAR', 'CORAL', 'EMBER', 'FLINT', 'FROST', 'GROVE', 'IVORY', 'JADE',
  'LUNAR', 'MAPLE', 'ONYX', 'ORBIT', 'PINE', 'RAVEN', 'RIDGE', 'RIVER',
  'SABLE', 'SOLAR', 'STONE', 'STORM', 'SWIFT', 'TIGER', 'TITAN', 'VALE',
  'VIPER', 'VISTA', 'WOLF', 'WREN',
];

function generateRoomCode(): string {
  const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${w1}-${w2}-${pin}`;
}
