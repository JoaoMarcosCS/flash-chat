import { ChatsSidebar } from '@/modules/chats/components/chats-sidebar';
import { ChatsSplitView } from '@/modules/chats/components/chats-split-view';

export default function ChatsLayout({ children }: LayoutProps<'/chats'>) {
  return <ChatsSplitView sidebar={<ChatsSidebar type="direct" />}>{children}</ChatsSplitView>;
}
