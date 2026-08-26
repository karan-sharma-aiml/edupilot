import { ReactNode } from 'react';
import { GlassCard } from './glass-card';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <GlassCard hover={false} className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 rounded-full bg-zinc-900/50 p-4 text-zinc-400">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-zinc-100">{title}</h3>
      <p className="mb-6 max-w-md text-zinc-400">{description}</p>
      {action && <div>{action}</div>}
    </GlassCard>
  );
}
