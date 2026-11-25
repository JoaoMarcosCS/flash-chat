'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { RenderIf } from './render-if';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  skeleton?: ReactNode;
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetching,
  onLoadMore,
  skeleton = <Skeleton className="h-12 w-full" />,
}: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !hasNextPage || isFetching) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [hasNextPage, isFetching, onLoadMore]);

  return (
    <RenderIf shouldRender={hasNextPage}>
      <div ref={ref} aria-busy={isFetching} className="flex min-h-px flex-col py-2">
        <div className={cn(!isFetching && 'invisible')}>{skeleton}</div>
      </div>
    </RenderIf>
  );
}
