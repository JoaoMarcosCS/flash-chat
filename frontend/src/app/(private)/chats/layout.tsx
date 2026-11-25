import { ChatsSplitView } from '@/modules/chats/components/chats-split-view';

export default function ChatsLayout({ children }: LayoutProps<'/chats'>) {
  return <ChatsSplitView type="direct">{children}</ChatsSplitView>;
}
