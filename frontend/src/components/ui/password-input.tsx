'use client';

import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

type PasswordInputProps = Omit<ComponentProps<typeof InputGroupInput>, 'type'>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Esconder senha' : 'Mostrar senha';

  return (
    <InputGroup>
      <InputGroupInput type={visible ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={label}
          aria-pressed={visible}
          title={label}
          onClick={() => setVisible((value) => !value)}
        >
          <RenderIf shouldRender={visible} fallback={<Eye />}>
            <EyeOff />
          </RenderIf>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
