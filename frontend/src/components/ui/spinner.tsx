import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <LoaderCircle
      aria-label="Carregando"
      className={cn('size-5 animate-spin text-foreground', className)}
    />
  );
}
