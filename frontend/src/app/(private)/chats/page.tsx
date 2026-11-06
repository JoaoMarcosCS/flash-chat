import { MessagesSquare } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export default function ChatsPage() {
  return (
    <EmptyState
      icon={MessagesSquare}
      title="Selecione uma conversa"
      description="Escolha uma conversa na lista ou comece uma nova."
    />
  );
}
