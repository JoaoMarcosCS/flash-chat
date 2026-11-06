'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './button';
import { RenderIf } from '@/components/common/render-if';

const COPIED_FEEDBACK_MS = 1500;

interface CopyButtonProps {
  value: string;
  label: string;
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? 'Copiado' : label}
      title={label}
      onClick={copy}
      className="size-7 text-muted-foreground hover:text-foreground"
    >
      <RenderIf shouldRender={copied} fallback={<Copy className="size-3.5" />}>
        <Check className="size-3.5 text-foreground" />
      </RenderIf>
    </Button>
  );
}
