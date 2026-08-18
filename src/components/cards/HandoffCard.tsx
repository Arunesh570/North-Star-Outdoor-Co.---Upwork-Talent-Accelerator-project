import React from 'react';
import { SupportTicket } from '../../types';
import { Headset, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';

interface HandoffCardProps {
  ticket?: SupportTicket;
  isFallback?: boolean;
  fallbackQuery?: string;
  onActionClick?: (actionText: string) => void;
  isActive?: boolean;
}

export const HandoffCard: React.FC<HandoffCardProps> = ({
  ticket,
  isFallback,
  fallbackQuery,
  onActionClick,
  isActive = false,
}) => {
  if (isFallback) {
    return (
      <div
        className="mt-2.5 rounded-2xl border p-4 shadow-sm backdrop-blur-md space-y-2.5"
        style={{ background: 'var(--card-bg)', borderColor: 'rgba(14,165,233,0.25)' }}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
            <Headset className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Need more help?</h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              I can connect you with a live specialist who can assist you directly.
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={isActive ? () => onActionClick?.('Connect with Live Agent') : undefined}
            disabled={!isActive}
            className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80"
            style={{
              background: 'rgba(14,165,233,0.12)',
              borderColor: 'rgba(14,165,233,0.35)',
              color: '#38bdf8',
            }}
          >
            Connect with Live Agent
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div
      className="mt-2.5 rounded-2xl border p-4 shadow-sm backdrop-blur-md space-y-3 animate-fade-in"
      style={{ background: 'var(--card-bg)', borderColor: 'rgba(56,189,248,0.3)' }}
    >
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--divider)' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
            <Headset className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{ticket.agentName}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Ticket #{ticket.ticketId}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-2.5 text-xs space-y-1" style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}>
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
          <CheckCircle2 className="h-3 w-3" />
          <span>Chat History Transferred</span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          You're in a live agent session. Feel free to ask questions or return to the main bot menu.
        </p>
      </div>

      {onActionClick && (
        <div className="pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--divider)' }}>
          <button
            onClick={isActive ? () => onActionClick('Return to Main Menu') : undefined}
            disabled={!isActive}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1 text-xs font-bold text-white transition-all disabled:opacity-35 disabled:pointer-events-none"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Main Menu</span>
          </button>
        </div>
      )}
    </div>
  );
};
