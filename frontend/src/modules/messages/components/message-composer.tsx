'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Lock, SendHorizontal } from 'lucide-react';
import { MESSAGE_COUNTER_THRESHOLD, MESSAGE_MAX_LENGTH } from '../schema/send-message.schema';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';

interface MessageComposerProps {
  readOnly: boolean;
  onSend: (content: string) => void;
}

export function MessageComposer({ readOnly, onSend }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const trimmed = content.trim();

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  };

  if (readOnly) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-border bg-surface px-4 py-5 text-sm text-muted-foreground">
        <Lock className="size-4" />
        Somente leitura: a conta da outra pessoa foi desativada.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-border bg-surface px-3 py-3 md:px-6"
    >
      <div className="flex min-h-11 flex-1 flex-col justify-center rounded-[22px] border border-border bg-surface px-4 py-2.5 transition-colors duration-150 focus-within:border-foreground">
        <label htmlFor="message" className="sr-only">
          Mensagem
        </label>
        <textarea
          id="message"
          rows={1}
          value={content}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="field-sizing-content max-h-40 resize-none bg-transparent text-[15px] leading-snug text-foreground outline-none placeholder:text-muted-foreground"
        />
        <RenderIf shouldRender={content.length >= MESSAGE_COUNTER_THRESHOLD}>
          <span className="self-end text-xs text-muted-foreground">
            {content.length}/{MESSAGE_MAX_LENGTH}
          </span>
        </RenderIf>
      </div>
      <Button type="submit" size="icon" aria-label="Enviar" disabled={!trimmed} className="size-11">
        <SendHorizontal className="size-5" />
      </Button>
    </form>
  );
}
