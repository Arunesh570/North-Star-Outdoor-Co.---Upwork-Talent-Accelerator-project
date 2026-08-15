import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { Package, Check, AlertCircle } from 'lucide-react';

interface OrderCardProps {
  order?: Order;
  isInvalid?: boolean;
  onActionClick?: (actionText: string) => void;
  isActive?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isInvalid,
  onActionClick,
  isActive = false,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const isDelivered = order?.id === '333';
  const isShipped = order?.id === '111';
  const isProcessing = order?.id === '222';

  // Realistic transit progress:
  // - Order #111 (Shipped, arriving tomorrow): 83.3% (ahead of Shipped at 66.6%, actively in transit towards Delivered at 100%)
  // - Order #222 (Processing in warehouse): 45% (past Confirmed at 0%, active in warehouse stage)
  // - Order #333 (Delivered): 100%
  const targetPercent = isDelivered ? 100 : isShipped ? 83.3 : isProcessing ? 45 : 10;

  useEffect(() => {
    // Emerge smoothly from 0 to checkpoint on mount
    const timer = setTimeout(() => {
      setAnimatedProgress(targetPercent);
    }, 120);

    return () => clearTimeout(timer);
  }, [targetPercent]);

  if (isInvalid || !order) {
    return (
      <div
        className="mt-2 max-w-xl rounded-2xl border p-4 shadow-md backdrop-blur-xl"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'rgba(248, 113, 113, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Order Number Not Found
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              We couldn't locate an order with that number. Please try one of these:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Order #111', 'Order #222', 'Order #333'].map(num => (
                <button
                  key={num}
                  onClick={isActive ? () => onActionClick?.(num) : undefined}
                  disabled={!isActive}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
                  style={{
                    background: 'var(--chip-bg)',
                    borderColor: 'var(--chip-border)',
                    color: 'var(--chip-text)',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cleanStatus = isDelivered ? 'Delivered' : isShipped ? 'Shipped' : 'Processing';
  const accentColor = isDelivered ? '#10b981' : isShipped ? '#f59e0b' : '#38bdf8';
  const badgeBg = isDelivered
    ? 'rgba(16, 185, 129, 0.15)'
    : isShipped
    ? 'rgba(245, 158, 11, 0.15)'
    : 'rgba(56, 189, 248, 0.15)';

  const steps = [
    { label: 'Confirmed',  threshold: 0,    done: true },
    { label: 'Processing', threshold: 33.3, done: isProcessing || isShipped || isDelivered },
    { label: 'Shipped',    threshold: 66.6, done: isShipped || isDelivered },
    { label: 'Delivered',  threshold: 100,  done: isDelivered },
  ];

  return (
    <div
      className="mt-2 max-w-xl rounded-2xl border p-3.5 sm:p-4 shadow-md backdrop-blur-xl space-y-3.5 transition-all"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Top Title Line: Order #111 | Shipped */}
      <div
        className="flex items-center justify-between gap-2 border-b pb-2.5"
        style={{ borderColor: 'var(--divider)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Package className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-display font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Order #{order.id}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>|</span>
          <span className="text-xs font-semibold" style={{ color: accentColor }}>
            {cleanStatus}
          </span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border"
          style={{ background: badgeBg, color: accentColor, borderColor: `${accentColor}40` }}
        >
          Status
        </span>
      </div>

      {/* Bullet Details with Symmetrical Spacing */}
      <div className="space-y-1.5 pl-0.5">
        <div className="flex items-start gap-2.5 text-xs leading-relaxed">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span style={{ color: 'var(--text-muted)' }}>
            Status: <strong style={{ color: 'var(--text-primary)' }}>{cleanStatus}</strong>
          </span>
        </div>
        {order.carrier && order.trackingNumber && (
          <div className="flex items-start gap-2.5 text-xs leading-relaxed">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span style={{ color: 'var(--text-muted)' }}>
              Carrier: <strong style={{ color: 'var(--text-primary)' }}>{order.carrier}</strong> ({order.trackingNumber})
            </span>
          </div>
        )}
        {order.estimatedDelivery && (
          <div className="flex items-start gap-2.5 text-xs leading-relaxed">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span style={{ color: 'var(--text-muted)' }}>
              Expected Delivery: <strong style={{ color: 'var(--text-primary)' }}>{order.estimatedDelivery}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 🚀 Concentric Symmetrical Stepper: All nodes, beam, and dot centered on the exact same axis */}
      <div className="py-2.5 px-2 sm:px-3">
        <div className="relative w-full h-7 flex items-center">
          {/* Background Track Line — Perfectly centered on Y-axis */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-2.5 right-2.5 h-1 rounded-full -z-0"
            style={{ background: 'var(--inset-border)' }}
          />

          {/* Animated Active Progress Beam — Perfectly centered on Y-axis */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-2.5 h-1 rounded-full transition-all duration-1000 ease-out -z-0"
            style={{
              width: `calc(${animatedProgress}% - 10px)`,
              background: isDelivered
                ? 'linear-gradient(to right, #10b981, #059669)'
                : isShipped
                ? 'linear-gradient(to right, #10b981, #10b981, #f59e0b)'
                : 'linear-gradient(to right, #10b981, #38bdf8)',
              boxShadow: `0 0 10px ${accentColor}75`,
            }}
          />

          {/* 📍 Centered Active In-Transit Beacon Dot (Zero text clutter, perfectly centered on line) */}
          {animatedProgress > 0 && !isDelivered && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center transition-all duration-1000 ease-out pointer-events-none"
              style={{ left: `calc(${animatedProgress}% - 4px)` }}
            >
              <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: accentColor }}
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border-2 shadow-md"
                  style={{ borderColor: accentColor }}
                />
              </span>
            </div>
          )}

          {/* Milestone Checkpoint Circles (4 Standard Stages) */}
          <div className="relative z-10 flex justify-between items-center w-full">
            {steps.map((step, idx) => {
              const isPassed = animatedProgress >= step.threshold;
              return (
                <div
                  key={idx}
                  className="flex h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-700 shadow-md"
                  style={
                    step.done && isPassed
                      ? {
                          background: '#10b981',
                          color: '#0f172a',
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                        }
                      : {
                          background: 'var(--inset-bg)',
                          border: '1.5px solid var(--inset-border)',
                          color: 'var(--text-dim)',
                        }
                  }
                >
                  {step.done && isPassed ? (
                    <Check className="h-3 w-3 stroke-[3] animate-fade-in" />
                  ) : (
                    idx + 1
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Labels below nodes */}
        <div className="flex justify-between items-center w-full mt-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`text-center ${
                idx === 0
                  ? 'w-16 -ml-2 text-left'
                  : idx === steps.length - 1
                  ? 'w-16 -mr-2 text-right'
                  : 'w-20'
              }`}
            >
              <span
                className="text-[10px] font-medium transition-colors duration-500"
                style={{
                  color: step.done ? 'var(--text-secondary)' : 'var(--text-dim)',
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-1.5 pt-1">
        {order.items.map(item => (
          <div
            key={item.sku}
            className="flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs backdrop-blur-md"
            style={{ background: 'var(--inset-bg)', borderColor: 'var(--inset-border)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img
                src={item.image}
                alt={item.name}
                className="h-10 w-10 rounded-lg object-cover border shrink-0"
                style={{ borderColor: 'var(--inset-border)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate text-xs" style={{ color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Qty {item.quantity} • ${item.price.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="font-bold font-display text-sm shrink-0" style={{ color: 'var(--text-primary)' }}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Action Capsules */}
      {onActionClick && (
        <div className="pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--divider)' }}>
          {isDelivered ? (
            <>
              <button
                onClick={isActive ? () => onActionClick(`Replace Damaged Item for Order #${order.id}`) : undefined}
                disabled={!isActive}
                className="rounded-full px-3 py-1.5 text-xs font-semibold border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 bg-amber-500/15 border-amber-500/30 text-amber-400 cursor-pointer"
              >
                🛠️ Replace Damaged Item
              </button>
              <button
                onClick={isActive ? () => onActionClick(`I want to change the size for Order #${order.id}`) : undefined}
                disabled={!isActive}
                className="rounded-full px-3 py-1.5 text-xs font-semibold border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 bg-emerald-500/15 border-emerald-500/30 text-emerald-400 cursor-pointer"
              >
                🔄 Size / Swap
              </button>
              <button
                onClick={isActive ? () => onActionClick(`Return Order #${order.id} for a refund`) : undefined}
                disabled={!isActive}
                className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
                style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
              >
                📦 Return for Refund
              </button>
            </>
          ) : (
            <button
              onClick={isActive ? () => onActionClick('Check Shipping Speeds') : undefined}
              disabled={!isActive}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
            >
              Shipping Speeds
            </button>
          )}
        </div>
      )}
    </div>
  );
};
