import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';

export interface ChatState {
  messages: ChatMessage[];
  send: (text: string) => void;
  registerChannel: (channel: RTCDataChannel, peerId: string) => void;
}

export function useChat(localPeerId: string, localDisplayName: string): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  const registerChannel = useCallback((channel: RTCDataChannel, peerId: string) => {
    channelsRef.current.set(peerId, channel);

    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ChatMessage;
        setMessages((prev) => [...prev, msg]);
      } catch {
        // malformed message
      }
    };

    channel.onclose = () => {
      channelsRef.current.delete(peerId);
    };
  }, []);

  const send = useCallback(
    (text: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: localPeerId,
        displayName: localDisplayName,
        text,
        timestamp: Date.now(),
      };
      const data = JSON.stringify(msg);
      for (const channel of channelsRef.current.values()) {
        if (channel.readyState === 'open') {
          channel.send(data);
        }
      }
      // Add to own messages
      setMessages((prev) => [...prev, msg]);
    },
    [localPeerId, localDisplayName]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.clear();
    };
  }, []);

  return { messages, send, registerChannel };
}
