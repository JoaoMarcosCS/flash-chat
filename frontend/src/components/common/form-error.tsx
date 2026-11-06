import { CircleAlert } from 'lucide-react';
import { RenderIf } from './render-if';

interface FormErrorProps {
  message: string | null;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <RenderIf shouldRender={message}>
      <p
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-foreground px-3.5 py-2.5 text-sm text-foreground"
      >
        <CircleAlert className="size-4 shrink-0" />
        {message}
      </p>
    </RenderIf>
  );
}
