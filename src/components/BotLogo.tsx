import React from 'react';

interface BotLogoProps {
  size?: number;
  isThinking?: boolean;
  className?: string;
}

/**
 * Geometric intersecting-rings logo.
 * Idle: Static triangular intersection (triquetra form). No motion.
 * Thinking: Rapid dynamic orbital revolutions and intersecting loops with a pulsing core glow.
 * ViewBox has generous padding and overflow:visible to guarantee zero clipping.
 */
export const BotLogo: React.FC<BotLogoProps> = ({
  size = 32,
  isThinking = false,
  className = '',
}) => {
  const r = size / 2;
  const ringR = size * 0.32;
  const offset = size * 0.19;
  const pad = size * 0.35; // generous margin so revolving rings are never clipped
  const totalView = size + pad * 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`-${pad} -${pad} ${totalView} ${totalView}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          <filter id={`ns-glow-${size}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={isThinking ? '1.5' : '0.6'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`ns-core-glow-${size}`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ring 1 — Top / Cool White */}
        <circle
          cx={r}
          cy={r - offset}
          r={ringR}
          stroke="rgba(248, 250, 252, 0.90)"
          strokeWidth="1.35"
          filter={`url(#ns-glow-${size})`}
          style={{
            transformOrigin: `${r}px ${r}px`,
            animation: isThinking ? 'ns-ring1-think 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
          }}
        />

        {/* Ring 2 — Bottom-Left / Sage Emerald */}
        <circle
          cx={r - offset * 0.866}
          cy={r + offset * 0.5}
          r={ringR}
          stroke="rgba(110, 231, 183, 0.85)"
          strokeWidth="1.35"
          filter={`url(#ns-glow-${size})`}
          style={{
            transformOrigin: `${r}px ${r}px`,
            animation: isThinking ? 'ns-ring2-think 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
          }}
        />

        {/* Ring 3 — Bottom-Right / Silver Sky */}
        <circle
          cx={r + offset * 0.866}
          cy={r + offset * 0.5}
          r={ringR}
          stroke="rgba(147, 197, 253, 0.80)"
          strokeWidth="1.35"
          filter={`url(#ns-glow-${size})`}
          style={{
            transformOrigin: `${r}px ${r}px`,
            animation: isThinking ? 'ns-ring3-think 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
          }}
        />

        {/* Core Intersection Glow — active only during thinking */}
        {isThinking && (
          <circle
            cx={r}
            cy={r}
            r={size * 0.09}
            fill="rgba(167, 243, 208, 0.95)"
            filter={`url(#ns-core-glow-${size})`}
            style={{
              animation: 'ns-core-pulse 0.75s ease-in-out infinite',
            }}
          />
        )}

        <style>{`
          @keyframes ns-ring1-think {
            0%   { transform: rotate(0deg) scale(1); }
            50%  { transform: rotate(180deg) scale(1.15); }
            100% { transform: rotate(360deg) scale(1); }
          }
          @keyframes ns-ring2-think {
            0%   { transform: rotate(0deg) scale(1); }
            50%  { transform: rotate(-180deg) scale(1.15); }
            100% { transform: rotate(-360deg) scale(1); }
          }
          @keyframes ns-ring3-think {
            0%   { transform: rotate(120deg) scale(1); }
            50%  { transform: rotate(300deg) scale(1.15); }
            100% { transform: rotate(480deg) scale(1); }
          }
          @keyframes ns-core-pulse {
            0%, 100% { opacity: 0.3; r: ${size * 0.07}px; }
            50%       { opacity: 1.0; r: ${size * 0.14}px; }
          }
        `}</style>
      </svg>
    </div>
  );
};
