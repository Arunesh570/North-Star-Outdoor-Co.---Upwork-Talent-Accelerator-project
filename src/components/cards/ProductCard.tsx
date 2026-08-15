import React from 'react';
import { Product } from '../../types';
import { Star, CloudRain, Flame, Tent, Backpack, Mountain, Compass, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  products?: Product[];
  isQuiz?: boolean;
  recommendedCategory?: string;
  onActionClick?: (text: string) => void;
  isActive?: boolean;
}

const QUIZ_OPTS = [
  { label: 'Rainy trail hiking',         icon: CloudRain },
  { label: 'Cold weather layering',      icon: Flame },
  { label: 'Weekend camping',            icon: Tent },
  { label: 'Multi-day backpacking',      icon: Backpack },
  { label: 'Alpine footwear',            icon: Mountain },
];

export const ProductCard: React.FC<ProductCardProps> = ({
  products,
  isQuiz,
  recommendedCategory,
  onActionClick,
  isActive = false,
}) => {
  /* ── Activity picker (2-step guided quiz) ─────────── */
  if (isQuiz) {
    return (
      <div className="mt-2.5 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          <Sparkles className="h-3 w-3" />
          <span>Select Adventure Condition:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUIZ_OPTS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={isActive ? () => onActionClick?.(label) : undefined}
              disabled={!isActive}
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-35 disabled:pointer-events-none hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95 cursor-pointer"
              style={{
                background: 'var(--chip-bg)',
                borderColor: 'var(--chip-border)',
                color: 'var(--chip-text)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!products?.length) return null;

  /* ── Product cards — Wide Horizontal Showcase Layout ─── */
  return (
    <div className="mt-3 space-y-3">
      {/* Category header */}
      {recommendedCategory && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            <Compass className="h-3.5 w-3.5" />
            <span>{recommendedCategory}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {products.length} {products.length === 1 ? 'Recommendation' : 'Recommendations'}
          </span>
        </div>
      )}


      {/* Horizontal Cards List */}
      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="group relative flex flex-col sm:flex-row gap-3.5 rounded-2xl border p-3 sm:p-3.5 transition-all duration-300 overflow-hidden shadow-lg backdrop-blur-xl"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            {/* 1. PHOTO (Left side) */}
            <div className="relative w-full sm:w-36 h-40 sm:h-32 rounded-xl overflow-hidden shrink-0 border border-white/[0.06]">
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Category pill on image */}
              <div
                className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                }}
              >
                {p.category}
              </div>

              {/* Rating badge on image */}
              <div
                className="absolute top-2 right-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  color: '#fcd34d',
                }}
              >
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span>{p.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* 2. DETAILS BESIDE THE PHOTO (Right side) */}
            <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
              {/* Product Title & Subtitle */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className="text-sm sm:text-[15px] font-bold leading-snug font-display group-hover:text-emerald-400 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {p.name}
                  </h4>
                </div>

                {/* Specs pill / Best For */}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                  <span className="truncate">{p.specs}</span>
                </div>

                {/* Description */}
                <p
                  className="text-xs line-clamp-2 mt-1 leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {p.description}
                </p>
              </div>

              {/* 3. BOTTOM ROW: Price on Left, "Learn More" on Right */}
              <div className="flex items-center justify-between gap-3 pt-2.5 mt-2 border-t border-white/[0.06]">
                {/* Price Display */}
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display">
                    ${p.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">USD</span>
                </div>

                {/* Direct Store Link Button */}
                <a
                  href={`https://northstaroutdoor.com/products/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`https://northstaroutdoor.com/products/${p.id}`, '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/25 transition-all cursor-pointer no-underline shrink-0"
                >
                  <span>View on Store</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation actions after viewing products */}
      {onActionClick && (
        <div className="pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--divider)' }}>
          <button
            onClick={isActive ? () => onActionClick('Explore Another Activity') : undefined}
            disabled={!isActive}
            className="rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
          >
            Explore Another Activity
          </button>
          <button
            onClick={isActive ? () => onActionClick('Return to Main Menu') : undefined}
            disabled={!isActive}
            className="rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all disabled:opacity-35 disabled:pointer-events-none hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--chip-bg)', borderColor: 'var(--chip-border)', color: 'var(--chip-text)' }}
          >
            Return to Main Menu
          </button>
        </div>
      )}
    </div>
  );
};
