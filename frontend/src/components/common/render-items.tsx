import { Fragment, type Key, type ReactNode } from 'react';

interface RenderItemsProps<T> {
  items: readonly T[] | null | undefined;
  getKey: (item: T) => Key;
  children: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
}

export function RenderItems<T>({ items, getKey, children, empty = null }: RenderItemsProps<T>) {
  if (!items?.length) return empty;

  return items.map((item, index) => (
    <Fragment key={getKey(item)}>{children(item, index)}</Fragment>
  ));
}
