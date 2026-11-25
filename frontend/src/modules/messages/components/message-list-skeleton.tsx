import { RenderItems } from '@/components/common/render-items';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ROWS = [
  { id: 1, own: false, width: 'w-48' },
  { id: 2, own: false, width: 'w-64' },
  { id: 3, own: true, width: 'w-40' },
  { id: 4, own: false, width: 'w-56' },
  { id: 5, own: true, width: 'w-72' },
  { id: 6, own: true, width: 'w-32' },
];

export function MessageListSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Carregando mensagens"
      className="flex flex-1 flex-col justify-end gap-4 overflow-hidden px-4 py-6 md:px-8"
    >
      <RenderItems items={ROWS} getKey={(row) => row.id}>
        {(row) => (
          <div className={cn('flex flex-col gap-1.5', row.own ? 'items-end' : 'items-start')}>
            <Skeleton className={cn('h-9 max-w-[80%] rounded-xl', row.width)} />
            <Skeleton className="h-3 w-12" />
          </div>
        )}
      </RenderItems>
    </div>
  );
}
