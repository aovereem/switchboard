import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  localPeerId: string;
}

export function ChatPanel({ messages, onSend, onClose, localPeerId }: Props) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  }

  return (
    <div className="flex flex-col w-80 bg-surface border-l border-white/5 h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-0.5 ${msg.from === localPeerId ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-gray-500">
              {msg.from === localPeerId ? 'You' : msg.displayName}
            </span>
            <div
              className={`px-3 py-2 rounded-xl text-sm max-w-[95%] break-words ${
                msg.from === localPeerId
                  ? 'bg-accent text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-white/5 flex gap-2">
        <input
          type="text"
          placeholder="Message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          className="flex-1 bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="bg-accent hover:bg-accent-dim disabled:opacity-40 text-white p-2 rounded-lg transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
