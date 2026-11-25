import { ChatsSplitView } from '@/modules/chats/components/chats-split-view';

export default function GroupsLayout({ children }: LayoutProps<'/groups'>) {
  return <ChatsSplitView type="group">{children}</ChatsSplitView>;
}
