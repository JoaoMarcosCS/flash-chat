'use client';

import { useEffect, useRef } from 'react';
import { RenderIf } from './render-if';
import { Spinner } from '@/components/ui/spinner';

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetching,
  onLoadMore,
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
      <div ref={ref} className="flex justify-center py-3">
        <RenderIf shouldRender={isFetching}>
          <Spinner />
        </RenderIf>
      </div>
    </RenderIf>
  );
}
