'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { MESSAGE_MAX_LENGTH } from '../schema/send-message.schema';
import { Button } from '@/components/ui/button';

interface MessageEditFormProps {
  initialContent: string;
  isSaving: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function MessageEditForm({
  initialContent,
  isSaving,
  onSave,
  onCancel,
}: MessageEditFormProps) {
  const [content, setContent] = useState(initialContent);
  const trimmed = content.trim();

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!trimmed || isSaving) return;
    onSave(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') onCancel();
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2">
      <label htmlFor="edit-message" className="sr-only">
        Editar mensagem
      </label>
      <textarea
        id="edit-message"
        autoFocus
        value={content}
        maxLength={MESSAGE_MAX_LENGTH}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(event) => event.target.setSelectionRange(content.length, content.length)}
        className="field-sizing-content max-h-40 min-w-56 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-[15px] leading-snug text-foreground outline-none focus:border-foreground"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!trimmed || isSaving}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
