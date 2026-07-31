import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LuEllipsisVertical, LuCrown, LuUserX } from 'react-icons/lu';
import { RiShieldStarLine } from 'react-icons/ri';
import { BsCircle, BsEye } from 'react-icons/bs';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from '../ui/RoleBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ROLES } from '../../constants/roles';
import { useRoom } from '../../context/RoomContext';
import { cn } from '../../utils/cn';

const ROLE_OPTIONS = [
  { role: ROLES.MODERATOR, label: 'Make Moderator', icon: RiShieldStarLine },
  { role: ROLES.PARTICIPANT, label: 'Make Participant', icon: BsCircle },
  { role: ROLES.VIEWER, label: 'Make Viewer', icon: BsEye },
];

export function ParticipantCard({ participant, isYou }) {
  const { isHost, you, actions } = useRoom();
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'remove' | 'transfer' }

  const canManage = isHost && participant.participantId !== you?.participantId;

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-hover">
        <Avatar username={participant.username} color={participant.avatarColor} online={participant.isOnline} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {participant.username}
            {isYou ? <span className="text-muted"> (you)</span> : null}
          </p>
          <RoleBadge role={participant.role} size="sm" />
        </div>

        {canManage ? (
          <Menu as="div" className="relative">
            <Menu.Button className="rounded-lg p-1.5 text-muted opacity-0 transition-opacity hover:bg-surface hover:text-ink group-hover:opacity-100 focus-visible:opacity-100">
              <LuEllipsisVertical className="h-4 w-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Menu.Items className="glass-card absolute right-0 z-20 mt-1 w-52 origin-top-right p-1.5 focus:outline-none">
                <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Assign role</p>
                {ROLE_OPTIONS.filter((opt) => opt.role !== participant.role).map((opt) => (
                  <Menu.Item key={opt.role}>
                    {({ active }) => (
                      <button
                        onClick={() => actions.assignRole(participant.participantId, opt.role)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink',
                          active && 'bg-surface-hover'
                        )}
                      >
                        <opt.icon className="h-3.5 w-3.5 text-muted" />
                        {opt.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}

                <div className="my-1.5 h-px bg-border" />

                <Menu.Item disabled={!participant.isOnline}>
                  {({ active, disabled }) => (
                    <button
                      onClick={() => setConfirmAction({ type: 'transfer' })}
                      disabled={disabled}
                      title={disabled ? `${participant.username} is currently offline` : undefined}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink',
                        active && 'bg-surface-hover',
                        disabled && 'cursor-not-allowed opacity-40'
                      )}
                    >
                      <LuCrown className="h-3.5 w-3.5 text-amber-400" />
                      Transfer host
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setConfirmAction({ type: 'remove' })}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-danger',
                        active && 'bg-danger/10'
                      )}
                    >
                      <LuUserX className="h-3.5 w-3.5" />
                      Remove from room
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={confirmAction?.type === 'remove'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          actions.removeParticipant(participant.participantId);
          setConfirmAction(null);
        }}
        title="Remove participant?"
        description={`${participant.username} will be immediately removed from the room.`}
        confirmLabel="Remove"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmAction?.type === 'transfer'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          actions.transferHost(participant.participantId);
          setConfirmAction(null);
        }}
        title="Transfer host?"
        description={`${participant.username} will become the new host and you will lose host privileges.`}
        confirmLabel="Transfer"
        variant="primary"
      />
    </>
  );
}
