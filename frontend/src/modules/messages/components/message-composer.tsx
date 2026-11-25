'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUp, Lock } from 'lucide-react';
import { MESSAGE_COUNTER_THRESHOLD, MESSAGE_MAX_LENGTH } from '../schema/send-message.schema';
import { RenderIf } from '@/components/common/render-if';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { useMessageScroller } from '@/components/ui/message-scroller';

interface MessageComposerProps {
  readOnly: boolean;
  onSend: (content: string) => void;
}

export function MessageComposer({ readOnly, onSend }: MessageComposerProps) {
  const { scrollToEnd } = useMessageScroller();
  const [content, setContent] = useState('');
  const trimmed = content.trim();

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
    scrollToEnd();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  };

  if (readOnly) {
    return (
      <div className="flex items-center justify-center gap-2 border-t bg-surface px-4 py-5 text-sm text-muted-foreground">
        <Lock className="size-4" />
        Somente leitura: a conta da outra pessoa foi desativada.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="shrink-0 px-4 pt-2 pb-4 md:px-8">
      <InputGroup className="bg-card has-disabled:bg-card has-disabled:opacity-100">
        <label htmlFor="message" className="sr-only">
          Mensagem
        </label>
        <InputGroupTextarea
          id="message"
          rows={1}
          value={content}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="max-h-40 min-h-14 text-[15px]"
        />
        <InputGroupAddon align="block-end" className="pt-1">
          <RenderIf shouldRender={content.length >= MESSAGE_COUNTER_THRESHOLD}>
            <InputGroupText className="text-xs tabular-nums">
              {content.length}/{MESSAGE_MAX_LENGTH}
            </InputGroupText>
          </RenderIf>
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            aria-label="Enviar"
            disabled={!trimmed}
            className="ml-auto"
          >
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
