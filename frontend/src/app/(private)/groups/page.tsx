import Link from 'next/link';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { buttonClassName } from '@/components/ui/button';

export default function GroupsPage() {
  return (
    <EmptyState
      icon={Users}
      title="Selecione um grupo"
      description="Escolha um grupo na lista ou crie um novo."
      action={
        <Link href="/groups/new" className={buttonClassName({ variant: 'soft', size: 'sm' })}>
          Novo grupo
        </Link>
      }
    />
  );
}
