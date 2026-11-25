'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../hooks/use-logout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const logout = useLogout();
  const [confirming, setConfirming] = useState(false);

  const confirm = () => {
    setConfirming(false);
    logout.mutate();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sair"
        title="Sair"
        className={className}
        disabled={logout.isPending}
        onClick={() => setConfirming(true)}
      >
        <LogOut className="size-[18px]" strokeWidth={1.75} />
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Sair da conta?"
        description="Você vai precisar entrar de novo com e-mail e senha."
        confirmLabel="Sair"
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
