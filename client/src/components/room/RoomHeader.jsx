import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuCopy, LuCheck, LuShare2, LuSettings, LuLogOut, LuUsers } from 'react-icons/lu';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { InviteModal } from '../modals/InviteModal';
import { SettingsModal } from '../modals/SettingsModal';
import { useRoom } from '../../context/RoomContext';
import { useSocket } from '../../context/SocketContext';
import { useClipboard } from '../../hooks/useClipboard';

export function RoomHeader() {
  const { roomCode, participants } = useRoom();
  const { status } = useSocket();
  const navigate = useNavigate();
  const { copied, copy } = useClipboard();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo showWordmark={false} />
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => copy(roomCode)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-sm font-semibold tracking-widest text-ink transition-colors hover:border-primary/40"
            >
              {roomCode}
              {copied ? <LuCheck className="h-3.5 w-3.5 text-accent" /> : <LuCopy className="h-3.5 w-3.5 text-muted" />}
            </button>
            <span className="flex items-center gap-1 text-xs text-muted">
              <LuUsers className="h-3.5 w-3.5" />
              {participants.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus status={status} className="hidden md:flex" />
          <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
            <LuShare2 className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <LuSettings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setLeaveOpen(true)} aria-label="Leave room">
            <LuLogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} roomCode={roomCode} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ConfirmDialog
        isOpen={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate('/')}
        title="Leave room?"
        description="You can rejoin later using the room code, as long as the room is still active."
        confirmLabel="Leave room"
        variant="danger"
      />
    </>
  );
}
