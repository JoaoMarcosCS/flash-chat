import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-[15px] text-foreground transition-colors duration-150 outline-none placeholder:text-muted-foreground focus:border-foreground aria-invalid:border-foreground',
        className,
      )}
      {...props}
    />
  );
}
