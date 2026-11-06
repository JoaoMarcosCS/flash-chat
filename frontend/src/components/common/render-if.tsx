import type { ReactNode } from 'react';

interface RenderIfProps {
  shouldRender: unknown;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RenderIf({ shouldRender, children, fallback = null }: RenderIfProps) {
  return shouldRender ? children : fallback;
}
