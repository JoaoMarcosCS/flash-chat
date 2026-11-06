'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { RenderIf } from '@/components/common/render-if';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Esconder senha' : 'Mostrar senha';

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
      <button
        type="button"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <RenderIf shouldRender={visible} fallback={<Eye className="size-[18px]" />}>
          <EyeOff className="size-[18px]" />
        </RenderIf>
      </button>
    </div>
  );
}
