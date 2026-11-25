'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { MESSAGE_MAX_LENGTH } from '../schema/send-message.schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    <form onSubmit={submit} className="flex w-full max-w-[80%] flex-col gap-2 self-end">
      <label htmlFor="edit-message" className="sr-only">
        Editar mensagem
      </label>
      <Textarea
        id="edit-message"
        autoFocus
        value={content}
        maxLength={MESSAGE_MAX_LENGTH}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(event) => event.target.setSelectionRange(content.length, content.length)}
        className="max-h-40 min-w-56 bg-card"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!trimmed || isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
