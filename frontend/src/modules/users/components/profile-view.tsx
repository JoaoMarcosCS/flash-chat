'use client';

import { useProfileQuery } from '../hooks/use-profile-query';
import { DeactivateUserSection } from './deactivate-user-section';
import { ProfileForm } from './profile-form';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { PanelHeader } from '@/components/layout/panel-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const FIELD_ROWS = [1, 2, 3, 4];

function ProfileFormSkeleton() {
  return (
    <div aria-busy aria-label="Carregando perfil" className="flex flex-col gap-5">
      <RenderItems items={FIELD_ROWS} getKey={(row) => row}>
        {() => (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
      </RenderItems>
      <Skeleton className="mt-2 h-8 w-32" />
    </div>
  );
}

export function ProfileView() {
  const query = useProfileQuery();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader showSidebarTrigger={false}>
        <h2 className="text-base font-semibold text-foreground">Perfil</h2>
      </PanelHeader>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10 px-4 py-6 md:px-6">
          <RenderIf shouldRender={query.isError}>
            <FormError message={query.isError ? getApiErrorMessage(query.error) : null} />
          </RenderIf>
          <RenderIf
            shouldRender={query.data}
            fallback={
              <RenderIf shouldRender={query.isPending}>
                <ProfileFormSkeleton />
              </RenderIf>
            }
          >
            {query.data && <ProfileForm profile={query.data} />}
          </RenderIf>
          <DeactivateUserSection />
        </div>
      </div>
    </div>
  );
}
