import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Trash2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { apiFetch, apiFetchRaw } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { ChatMessage } from '../../api/types';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hi there! I'm your AI career advisor. How can I help you today? I can review cover letters, give career advice, or help you prepare for an interview.",
};

const QUICK_PROMPTS = [
  'Write a cover letter for a Frontend Developer role',
  "How should I answer 'What is your greatest weakness?'",
  'Help me negotiate my salary',
  'What skills should I learn for AI engineering?',
];

export default function AiChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const cappedMessages = newMessages.slice(-10);
    const body = JSON.stringify({ messages: cappedMessages });

    // Try the streaming endpoint first for the lowest perceived latency: the
    // reply renders token-by-token. If anything about the stream fails, fall
    // back to the plain /ai/chat request so chat always works.
    let streamedAny = false;
    try {
      const res = await apiFetchRaw('/ai/chat/stream', { method: 'POST', body });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          if (!streamedAny) {
            // First chunk: clear the typing indicator and open the bubble.
            streamedAny = true;
            setIsLoading(false);
            setMessages((prev) => [...prev, { role: 'assistant', content: chunk }]);
          } else {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: 'assistant',
                content: next[next.length - 1].content + chunk,
              };
              return next;
            });
          }
        }
      }
    } catch {
      // fall through to non-streaming fallback below
    }

    if (streamedAny) {
      setIsLoading(false);
      return;
    }

    // Fallback: non-streaming request.
    try {
      const res = await apiFetch<{ reply: string }>('/ai/chat', {
        method: 'POST',
        body,
      });
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: "I'm sorry, I ran into an error. Please try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>AI career chat</h1>
          <p className="text-muted" style={{ fontSize: 14 }}>Personalized guidance for your job search</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setMessages([INITIAL_MESSAGE])}>
          <Trash2 size={14} /> Clear
        </button>
      </div>

      <div className="card card-flush" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={i}
                  style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '82%' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {!isUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                      <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                      <span className="eyebrow" style={{ fontSize: 11 }}>Advisor</span>
                    </div>
                  )}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isUser ? 'var(--accent)' : 'var(--surface-sunken)',
                      color: isUser ? 'var(--accent-ink)' : 'var(--ink)',
                      fontSize: 14.5,
                      lineHeight: 1.6,
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                  <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                  <span className="eyebrow" style={{ fontSize: 11 }}>Advisor</span>
                </div>
                <div style={{ background: 'var(--surface-sunken)', borderRadius: '14px 14px 14px 4px', padding: '14px 16px', display: 'flex', gap: 5 }}>
                  {[0, 0.15, 0.3].map((delay) => (
                    <span
                      key={delay}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--ink-faint)',
                        animation: `pulseDot 1s ${delay}s infinite ease-in-out`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div style={{ padding: '0 24px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '12px 14px', fontWeight: 500 }}
              >
                <MessageSquare size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--ink-faint)' }} />
                <span style={{ whiteSpace: 'normal' }}>{prompt}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: 18, borderTop: '1px solid var(--border)' }}>
          <form
            style={{ display: 'flex', gap: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <input
              type="text"
              className="input-field"
              placeholder={`Ask anything, ${user?.full_name?.split(' ')[0] || 'there'}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-icon" disabled={!input.trim() || isLoading} aria-label="Send message" style={{ width: 44, height: 44 }}>
              {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .markdown-content p { margin-bottom: 0.5rem; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content ul { list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.5rem; }
        .markdown-content code { font-family: var(--font-mono); background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
      `}</style>
    </div>
  );
}
