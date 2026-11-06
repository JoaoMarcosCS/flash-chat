import Link from 'next/link';
import { AuthCard } from '@/modules/auth/components/auth-card';
import { RegisterForm } from '@/modules/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Comece a conversar em segundos."
      footer={
        <>
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
