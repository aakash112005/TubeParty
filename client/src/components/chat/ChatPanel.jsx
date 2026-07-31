import { useEffect, useRef } from 'react';
import { LuMessageCircle } from 'react-icons/lu';
import { useRoom } from '../../context/RoomContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from '../ui/EmptyState';

export function ChatPanel() {
  const { chatMessages, typingUsers, you } = useRoom();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages.length]);

  return (
    <div className="glass-card flex h-full flex-col p-3">
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-ink">
        <LuMessageCircle className="h-4 w-4 text-muted" />
        Chat
      </div>

      <div ref={scrollRef} className="mt-1 flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {chatMessages.length === 0 ? (
          <EmptyState icon={<LuMessageCircle />} title="No messages yet" description="Say hello to everyone in the room." />
        ) : (
          chatMessages.map((message) => (
            <ChatMessage key={message.id} message={message} isOwn={message.username === you?.username} />
          ))
        )}
      </div>

      <TypingIndicator typingUsers={typingUsers.filter((u) => u !== you?.username)} />
      <ChatInput />
    </div>
  );
}
