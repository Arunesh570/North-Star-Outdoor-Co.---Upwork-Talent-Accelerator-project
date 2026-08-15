import React from 'react';
import { Package, RotateCcw, RefreshCw, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  actions: string[];
  onSelect: (action: string) => void;
  isActive: boolean;
}

const META: Record<string, { icon: React.ElementType; label: string }> = {
  'Track my order': { icon: Package,   label: 'Track my order' },
  'Return':         { icon: RotateCcw, label: 'Return' },
  'Replacement':    { icon: RefreshCw, label: 'Replacement' },
  'Suggestions':    { icon: Sparkles,  label: 'Suggestions' },
};

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, onSelect, isActive }) => {
  if (!actions?.length) return null;

  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {actions.map(action => {
        const { icon: Icon, label } = META[action] ?? { icon: Sparkles, label: action };

        return (
          <button
            key={action}
            onClick={isActive ? () => onSelect(action) : undefined}
            disabled={!isActive}
            className={[
              'capsule-glow',
              'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold',
              'border transition-all duration-200',
              isActive
                ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.97] hover:opacity-90'
                : 'opacity-35 cursor-default pointer-events-none',
            ].join(' ')}
            style={{
              background: 'var(--action-bg)',
              borderColor: 'var(--action-border)',
              color: 'var(--action-text)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              // inner glow is applied via the CSS animation
            }}
          >
            <Icon
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: 'var(--action-icon)' }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
};
