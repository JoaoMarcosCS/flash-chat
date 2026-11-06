import { useEffect, useRef } from 'react';

export function useResetOnHide(reset: () => void) {
  const resetRef = useRef(reset);

  useEffect(() => {
    resetRef.current = reset;
  });

  useEffect(() => () => resetRef.current(), []);
}
