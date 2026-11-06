import { AppShell } from '@/components/layout/app-shell';
import { SessionGate } from '@/modules/auth/components/session-gate';
import { RealtimeConnector } from '@/modules/realtime/components/realtime-connector';

export default function PrivateLayout({ children }: LayoutProps<'/'>) {
  return (
    <SessionGate>
      <RealtimeConnector />
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
