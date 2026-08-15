import React from 'react';
import { ReturnPolicyInfo, ShippingPolicyInfo, Order } from '../../types';
import { RotateCcw, Calendar, CheckSquare, Box, ExternalLink, Truck } from 'lucide-react';

interface ReturnCardProps {
  returnPolicy?: ReturnPolicyInfo;
  shippingPolicy?: ShippingPolicyInfo;
  order?: Order;
  onActionClick?: (actionText: string) => void;
  isActive?: boolean;
}

export const ReturnCard: React.FC<ReturnCardProps> = ({
  returnPolicy,
  shippingPolicy,
  order,
  onActionClick,
  isActive = false,
}) => {
  if (shippingPolicy) {
    if (order) {
      const isDelivered = order.id === '333';
      const isShipped = order.id === '111';
      const isProcessing = order.id === '222';
      const cleanStatus = isDelivered ? 'Delivered' : isShipped ? 'Shipped' : 'Processing';
      const accentColor = isDelivered ? '#10b981' : isShipped ? '#f59e0b' : '#38bdf8';
      const badgeBg = isDelivered
        ? 'rgba(16, 185, 129, 0.15)'
        : isShipped
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(56, 189, 248, 0.15)';

      const speedLabel = isShipped
        ? '3–5 Business Days'
        : isProcessing
        ? '2–3 Business Days'
        : '1–2 Business Days';

      const serviceType = isShipped
        ? 'Standard Ground Transit'
        : isProcessing
        ? 'Expedited Priority Transit'
        : 'Expedited 2-Day Air Transit';

      return (
        <div
          className="mt-2 max-w-xl rounded-2xl border p-3.5 sm:p-4 shadow-md backdrop-blur-xl space-y-3 transition-all"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-display font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Order #{order.id} • Assigned Courier Transit
              </span>
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border"
              style={{ background: badgeBg, color: accentColor, borderColor: `${accentColor}40` }}
            >
              {cleanStatus}
            </span>
          </div>

          {/* Dedicated Single Courier Card */}
          <div
            className="rounded-xl border p-3 space-y-2.5 backdrop-blur-md"
            style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Transit Speed
                </span>
                <div className="font-display font-bold text-sm sm:text-base mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {serviceType}
                </div>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold border shadow-sm shrink-0"
                style={{ background: badgeBg, color: accentColor, borderColor: `${accentColor}40` }}
              >
                {speedLabel}
              </span>
            </div>

            <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ borderColor: 'var(--inset-border)' }}>
              <div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Carrier & Tracking</div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {order.carrier} <span className="text-[11px] font-mono opacity-80">({order.trackingNumber})</span>
                </div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Estimated Delivery</div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {order.estimatedDelivery}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // General store shipping speeds (when no specific order is in context)
    return (
      <div
        className="mt-2.5 max-w-xl rounded-2xl border p-4 shadow-md backdrop-blur-xl space-y-3"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: 'var(--divider)' }}>
          <Truck className="h-4 w-4 text-sky-400" />
          <h4 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Shipping Speeds</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border p-2.5 space-y-1" style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}>
            <div className="font-semibold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>Standard Ground</span>
              <span className="text-[10px] font-bold text-emerald-400">3–5 days</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{shippingPolicy.standard}</p>
          </div>
          <div className="rounded-xl border p-2.5 space-y-1" style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}>
            <div className="font-semibold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>Expedited Air</span>
              <span className="text-[10px] font-bold text-amber-400">1–2 days</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{shippingPolicy.expedited}</p>
          </div>
        </div>

        {onActionClick && (
          <div className="pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--divider)' }}>
            <button
              onClick={isActive ? () => onActionClick('Track an Order') : undefined}
              disabled={!isActive}
              className="rounded-full px-3.5 py-1 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
            >
              Track an Order
            </button>
            <button
              onClick={isActive ? () => onActionClick('Return to Main Menu') : undefined}
              disabled={!isActive}
              className="rounded-full px-3.5 py-1 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
            >
              Return to Main Menu
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="mt-2.5 rounded-2xl border p-4 shadow-sm backdrop-blur-md space-y-3"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--divider)' }}>
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-emerald-400" />
          <h4 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>30-Day Return & Exchange Policy</h4>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
          30 Days
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {[
          { Icon: Calendar,    title: '30-Day Window',     note: 'From delivery date' },
          { Icon: CheckSquare, title: 'Unused Items',       note: 'In brand-new condition' },
          { Icon: Box,         title: 'Original Tags',      note: 'Packaging required' },
        ].map(({ Icon, title, note }) => (
          <div key={title} className="rounded-xl border p-2 space-y-0.5" style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}>
            <div className="flex items-center gap-1.5 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Icon className="h-3 w-3 text-emerald-400" />
              <span>{title}</span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{note}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border p-2.5 flex items-center justify-between gap-2"
        style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}
      >
        <div className="text-xs">
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Self-Service Returns</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Download return labels or start an exchange online.</div>
        </div>
        <a
          href={returnPolicy?.returnsUrl || 'https://northstaroutdoor.com/returns'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            alert('Opening North Star Self-Service Returns Portal: https://northstaroutdoor.com/returns');
          }}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-500 hover:bg-emerald-400 px-3 py-1 text-xs font-bold text-white transition-all shadow-sm active:scale-95 shrink-0"
        >
          <span>Returns Portal</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {onActionClick && (
        <div className="pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--divider)' }}>
          <button
            onClick={isActive ? () => onActionClick('Track Order #333') : undefined}
            disabled={!isActive}
            className="rounded-full px-3.5 py-1 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
          >
            Check Order #333
          </button>
          <button
            onClick={isActive ? () => onActionClick('Shipping Speeds') : undefined}
            disabled={!isActive}
            className="rounded-full px-3.5 py-1 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
          >
            Shipping Speeds
          </button>
        </div>
      )}
    </div>
  );
};
