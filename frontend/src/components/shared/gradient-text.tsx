import { ReactNode, ElementType } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function GradientText({ children, className, as: Component = 'span' }: GradientTextProps) {
  return (
    <Component className={cn('gradient-text', className)}>
      {children}
    </Component>
  );
}
