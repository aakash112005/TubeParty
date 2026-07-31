import { EMOJI_REACTIONS } from '../../constants/app';
import { useRoom } from '../../context/RoomContext';

export function ReactionBar() {
  const { actions, settings } = useRoom();

  if (!settings.reactionsEnabled) return null;

  return (
    <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {EMOJI_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => actions.sendReaction(emoji)}
          className="rounded-lg px-2 py-1 text-lg transition-transform hover:scale-125 active:scale-90"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
