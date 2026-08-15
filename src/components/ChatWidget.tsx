import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { BotLogo } from './BotLogo';
import { ArrowUp, ArrowLeft } from 'lucide-react';

interface ChatWidgetProps {
  messages: Message[];
  isLoading: boolean;
  thinkingLabel: string;
  onSendMessage: (text: string) => void;
  onQuickAction: (action: string) => void;
  onResetChat: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  isLoading,
  thinkingLabel,
  onSendMessage,
  onQuickAction,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = inputText.trim();
    if (!t || isLoading) return;
    onSendMessage(t);
    setInputText('');
  };

  const lastMsg = messages[messages.length - 1];
  const isLiveAgent = lastMsg?.isLiveAgentState ?? false;

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative" style={{ background: 'transparent' }}>

      {/* Live Agent Banner */}
      {isLiveAgent && (
        <div
          className="px-6 py-2.5 flex items-center justify-between text-xs backdrop-blur-md"
          style={{
            background: 'var(--live-banner-bg)',
            borderBottom: '1px solid var(--live-banner-border)',
            color: 'var(--live-banner-text)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Live Specialist Connected</span>
          </div>
          <button
            onClick={() => onSendMessage('Return to Main Menu')}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ background: 'var(--header-btn-bg)', border: '1px solid var(--header-btn-border)', color: 'var(--live-banner-text)' }}
          >
            <ArrowLeft className="h-3 w-3" />
            Return to Bot
          </button>
        </div>
      )}

      {/* Messages Scroll Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
        <div className="mx-auto max-w-3xl lg:max-w-4xl space-y-4 pb-2">
          {messages.map(msg => (
            <MessageItem
              key={msg.id}
              message={msg}
              onActionClick={isLoading ? undefined : (t) => onSendMessage(t)}
              onQuickAction={onQuickAction}
            />
          ))}

          {/* Claude-Style Thinking State */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in py-1">
              <div className="mt-0.5 shrink-0">
                <BotLogo size={28} isThinking />
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="thinking-shimmer text-xs font-medium">{thinkingLabel}</span>
                <div className="flex gap-1 mt-0.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: `${i * 180}ms`, animationDuration: '1.2s' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Capsule Input Bar */}
      <div className="px-4 pb-5 pt-1 sm:px-8">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="floating-capsule relative flex items-center rounded-full px-4 py-1.5 backdrop-blur-2xl transition-all duration-200"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask about your order, returns, or gear recommendations..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm outline-none placeholder-[var(--text-dim)] disabled:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 text-white transition-all shadow-md active:scale-90"
              aria-label="Send Message"
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
