import { Zap } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';

interface BrandProps {
  showName?: boolean;
}

export function Brand({ showName = true }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-inverse text-inverse-foreground">
        <Zap className="size-[18px] fill-current" strokeWidth={1.5} />
      </span>
      <RenderIf shouldRender={showName}>
        <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">Flash Chat</span>
      </RenderIf>
    </span>
  );
}
