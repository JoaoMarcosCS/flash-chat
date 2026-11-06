'use client';

import { useRealtime } from '../hooks/use-realtime';

export function RealtimeConnector() {
  useRealtime();
  return null;
}
