import React from 'react';
import { Message } from '../types';
import { OrderCard } from './cards/OrderCard';
import { ReturnCard } from './cards/ReturnCard';
import { ProductCard } from './cards/ProductCard';
import { HandoffCard } from './cards/HandoffCard';
import { QuickActions } from './QuickActions';
import { BotLogo } from './BotLogo';
import { User } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onActionClick?: (text: string) => void;
  onQuickAction?: (action: string) => void;
}

/* ── Inline markdown parser ─────────────────────────── */
const parseInline = (str: string) =>
  str
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-emerald-400 hover:underline font-semibold">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600;color:var(--text-primary)">$1</strong>')
    .replace(/\*((?!\*)(.*?))\*/g, '<em style="color:var(--text-muted)">$2</em>')
    .replace(/`(.*?)`/g, '<code style="background:var(--surface-high);color:#67e8f9;padding:0.1rem 0.35rem;border-radius:0.25rem;font-size:0.85em;font-family:monospace">$1</code>');

/* ── Block markdown renderer with pixel-perfect alignment ─ */
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-1.5" />;

    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className="font-display font-bold text-sm mt-2 mb-1" style={{ color: '#10b981' }}>
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="font-display font-bold text-sm mt-2.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {line.slice(3)}
        </h2>
      );
    }
    // Symmetrical bullet list item with custom glowing dot
    if (/^[-•*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-•*]\s+/, '');
      return (
        <div key={i} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <div
            className="text-[13px] leading-relaxed flex-1"
            style={{ color: 'var(--text-secondary)' }}
            dangerouslySetInnerHTML={{ __html: parseInline(content) }}
          />
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-[13px] my-1 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
        dangerouslySetInnerHTML={{ __html: parseInline(line) }}
      />
    );
  });
};

/* ── Component ───────────────────────────────────────── */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onActionClick,
  onQuickAction,
}) => {
  const isBot = message.role === 'assistant';
  const isLive = message.isLiveAgentState;
  const isActive = message.isLatestBotMessage ?? false;
  const hasCard = Boolean(message.card);

  return (
    <div className={`flex gap-3 animate-fade-up ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar with circular aura halo */}
      <div className="shrink-0 mt-0.5">
        {isBot ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] shadow-sm">
            <BotLogo size={22} />
          </div>
        ) : (
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: 'var(--bubble-user-bg)', color: 'var(--bubble-user-text)' }}
          >
            <User className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Content — compact for normal messages, max-w-xl for rich cards */}
      <div className={`flex ${hasCard ? 'w-full max-w-full sm:max-w-xl md:max-w-2xl' : 'max-w-[88%] sm:max-w-[80%]'} flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Sender name + timestamp */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            {isBot ? 'North Star Support' : 'You'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {message.timestamp}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-sky-400">
              <span className="h-1 w-1 rounded-full bg-sky-400 animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* Message Bubble with specular top reflection */}
        <div
          className="rounded-2xl px-4 py-3 shadow-md backdrop-blur-xl transition-all"
          style={
            isBot
              ? {
                  background: 'var(--bubble-bot-bg)',
                  border: '1px solid var(--bubble-bot-border)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  borderBottomLeftRadius: '0.375rem',
                }
              : {
                  background: 'var(--bubble-user-bg)',
                  color: 'var(--bubble-user-text)',
                  boxShadow: '0 8px 24px rgba(6, 95, 70, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  borderBottomRightRadius: '0.375rem',
                }
          }
        >
          <div className={`md ${!isBot ? 'md-user' : ''}`}>{renderMarkdown(message.content)}</div>
        </div>

        {/* QuickActions (opening 4-capsule set) */}
        {isBot && message.quickActions?.length ? (
          <QuickActions
            actions={message.quickActions}
            onSelect={onQuickAction ?? (() => {})}
            isActive={isActive}
          />
        ) : null}

        {/* QuickReplies — contextual suggestion chips (only when no card provides its own buttons) */}
        {isBot && message.quickReplies?.length && !message.quickActions?.length && !message.card ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={isActive ? () => onActionClick?.(reply) : undefined}
                disabled={!isActive}
                className="rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none hover:opacity-80 active:scale-95 cursor-pointer"
                style={{
                  background: 'var(--chip-bg)',
                  borderColor: 'var(--chip-border)',
                  color: 'var(--chip-text)',
                }}
              >
                {reply}
              </button>
            ))}
          </div>
        ) : null}

        {/* Rich Cards */}
        {message.card && (
          <div className="w-full mt-1.5">
            {message.card.type === 'order_status' && message.card.order && (
              <OrderCard order={message.card.order} onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'order_invalid' && (
              <OrderCard isInvalid onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'return_policy' && (
              <ReturnCard returnPolicy={message.card.returnPolicy} onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'shipping_info' && (
              <ReturnCard shippingPolicy={message.card.shippingPolicy} order={message.card.order} onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'product_recommendations' && (
              <ProductCard products={message.card.products} recommendedCategory={message.card.recommendedCategory} onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'recommendation_quiz' && (
              <ProductCard isQuiz onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'human_handoff' && (
              <HandoffCard ticket={message.card.ticket} onActionClick={onActionClick} isActive={isActive} />
            )}
            {message.card.type === 'fallback_help' && (
              <HandoffCard isFallback fallbackQuery={message.card.fallbackQuery} onActionClick={onActionClick} isActive={isActive} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
