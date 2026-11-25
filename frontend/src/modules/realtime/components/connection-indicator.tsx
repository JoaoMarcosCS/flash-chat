'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useConnectionStore } from '../store/connection.store';
import { RenderIf } from '@/components/common/render-if';

export function ConnectionIndicator() {
  const status = useConnectionStore((state) => state.status);

  return (
    <RenderIf shouldRender={status === 'connecting' || status === 'closed'}>
      <div
        role="status"
        className="flex items-center justify-center gap-2 bg-inverse px-4 py-1.5 text-xs font-medium text-inverse-foreground"
      >
        <RenderIf
          shouldRender={status === 'connecting'}
          fallback={<WifiOff className="size-3.5" />}
        >
          <Wifi className="size-3.5 animate-pulse" />
        </RenderIf>
        {status === 'connecting' ? 'Conectando...' : 'Sem conexão, tentando novamente'}
      </div>
    </RenderIf>
  );
}
