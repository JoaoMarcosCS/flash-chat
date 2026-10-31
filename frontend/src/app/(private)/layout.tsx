import { SessionGate } from '@/modules/auth/components/session-gate';

export default function PrivateLayout({ children }: LayoutProps<'/'>) {
  return <SessionGate>{children}</SessionGate>;
}
