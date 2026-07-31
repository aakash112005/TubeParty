import { LuUsers } from 'react-icons/lu';
import { ParticipantCard } from './ParticipantCard';
import { EmptyState } from '../ui/EmptyState';
import { useRoom } from '../../context/RoomContext';

export function ParticipantsPanel() {
  const { participants, you } = useRoom();

  return (
    <div className="glass-card flex h-full flex-col p-3">
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-ink">
        <LuUsers className="h-4 w-4 text-muted" />
        Participants
        <span className="ml-auto rounded-full bg-surface-hover px-2 py-0.5 text-xs font-normal text-muted">
          {participants.length}
        </span>
      </div>

      <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto">
        {participants.length === 0 ? (
          <EmptyState icon={<LuUsers />} title="No one else here yet" description="Share the room code to invite others." />
        ) : (
          participants
            .slice()
            .sort((a, b) => a.joinedAt - b.joinedAt)
            .map((p) => (
              <ParticipantCard key={p.participantId} participant={p} isYou={p.participantId === you?.participantId} />
            ))
        )}
      </div>
    </div>
  );
}
