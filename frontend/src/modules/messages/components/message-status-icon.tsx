import { Check, CheckCheck, CircleAlert, Clock3 } from 'lucide-react';
import type { MessageStatus } from '../interface/message.interface';

const icons = {
  pending: { Icon: Clock3, label: 'Enviando', className: '' },
  published: { Icon: Check, label: 'Enviada', className: '' },
  persisted: { Icon: CheckCheck, label: 'Salva', className: '' },
  failed: { Icon: CircleAlert, label: 'Não enviada', className: 'text-foreground' },
};

interface MessageStatusIconProps {
  status: MessageStatus;
}

export function MessageStatusIcon({ status }: MessageStatusIconProps) {
  const { Icon, label, className } = icons[status];
  return <Icon aria-label={label} className={`size-3.5 shrink-0 ${className}`} />;
}
