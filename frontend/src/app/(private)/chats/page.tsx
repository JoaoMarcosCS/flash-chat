import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { buttonClassName } from '@/components/ui/button';

export default function ChatsPage() {
  return (
    <EmptyState
      icon={MessagesSquare}
      title="Selecione uma conversa"
      description="Escolha uma conversa na lista ou comece uma nova."
      action={
        <Link href="/chats/new" className={buttonClassName({ variant: 'soft', size: 'sm' })}>
          Nova conversa
        </Link>
      }
    />
  );
}
