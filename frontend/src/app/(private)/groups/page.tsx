import { Users } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export default function GroupsPage() {
  return (
    <EmptyState
      icon={Users}
      title="Selecione um grupo"
      description="Escolha um grupo na lista ou crie um novo."
    />
  );
}
