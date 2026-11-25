import Link from 'next/link';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { buttonVariants } from '@/components/ui/button';

export default function GroupsPage() {
  return (
    <EmptyState
      icon={Users}
      title="Selecione um grupo"
      description="Escolha um grupo na lista ou crie um novo."
      action={
        <Link href="/groups/new" className={buttonVariants({ variant: 'secondary' })}>
          Novo grupo
        </Link>
      }
    />
  );
}
