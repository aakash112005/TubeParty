import { useRoom } from '../../context/RoomContext';
import { Avatar } from '../ui/Avatar';

function useAvatarColorFor(username) {
  const { participants } = useRoom();
  return participants.find((p) => p.username === username)?.avatarColor || '#7C6CFF';
}

export function ChatMessage({ message, isOwn }) {
  const color = useAvatarColorFor(message.username);

  return (
    <div className={`flex items-start gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar username={message.username} color={color} size="sm" />
      <div className={`flex max-w-[75%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn ? <span className="mb-0.5 px-1 text-xs font-medium text-muted">{message.username}</span> : null}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm ${
            isOwn ? 'rounded-tr-sm bg-primary text-white' : 'rounded-tl-sm bg-surface-hover text-ink'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
