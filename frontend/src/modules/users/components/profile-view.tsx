'use client';

import { useProfileQuery } from '../hooks/use-profile-query';
import { ProfileForm } from './profile-form';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { PanelHeader } from '@/components/layout/panel-header';
import { Spinner } from '@/components/ui/spinner';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export function ProfileView() {
  const query = useProfileQuery();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader>
        <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
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
                <div className="flex justify-center py-10">
                  <Spinner className="size-7" />
                </div>
              </RenderIf>
            }
          >
            {query.data && <ProfileForm profile={query.data} />}
          </RenderIf>
        </div>
      </div>
    </div>
  );
}
