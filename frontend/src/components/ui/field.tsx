import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      <RenderIf shouldRender={error}>
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-sm text-foreground"
        >
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
          {error}
        </p>
      </RenderIf>
    </div>
  );
}
