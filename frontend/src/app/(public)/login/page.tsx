import Link from 'next/link';
import { AuthCard } from '@/modules/auth/components/auth-card';
import { LoginForm } from '@/modules/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Bom te ver de novo."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
