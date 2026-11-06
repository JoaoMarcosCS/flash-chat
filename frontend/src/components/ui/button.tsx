import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-inverse text-inverse-foreground hover:bg-inverse/85',
  soft: 'bg-muted text-foreground hover:bg-border',
  ghost: 'text-foreground hover:bg-muted',
  outline: 'border border-border bg-surface text-foreground hover:border-foreground',
};

const sizes = {
  sm: 'h-9 rounded-lg px-3.5 text-sm',
  md: 'h-11 rounded-lg px-5 text-[15px]',
  icon: 'size-10 rounded-full',
  'icon-sm': 'size-8 rounded-full',
};

interface ButtonStyle {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}

export function buttonClassName({ variant = 'primary', size = 'md', className }: ButtonStyle) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium transition-[background-color,border-color,transform] duration-150 ease-out-strong select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ComponentProps<'button'>, ButtonStyle {}

export function Button({ variant, size, type = 'button', className, ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
  );
}
