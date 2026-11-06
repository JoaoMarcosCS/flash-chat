import { ChatsSidebar } from '@/modules/chats/components/chats-sidebar';
import { ChatsSplitView } from '@/modules/chats/components/chats-split-view';

export default function GroupsLayout({ children }: LayoutProps<'/groups'>) {
  return <ChatsSplitView sidebar={<ChatsSidebar type="group" />}>{children}</ChatsSplitView>;
}
