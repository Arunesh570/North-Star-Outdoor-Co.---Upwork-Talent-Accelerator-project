import React from 'react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ replies, onSelect, disabled }) => {
  if (!replies?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="rounded-full px-3.5 py-1 text-xs font-medium border
                     transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none
                     hover:opacity-80 active:scale-95"
          style={{
            background: 'var(--chip-bg)',
            borderColor: 'var(--chip-border)',
            color: 'var(--chip-text)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
};
