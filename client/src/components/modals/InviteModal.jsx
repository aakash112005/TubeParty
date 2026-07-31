import { QRCodeSVG } from 'qrcode.react';
import { LuCopy, LuCheck, LuShare2, LuDownload } from 'react-icons/lu';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useClipboard } from '../../hooks/useClipboard';
import { useShare } from '../../hooks/useShare';
import { useTheme } from '../../context/ThemeContext';

export function InviteModal({ isOpen, onClose, roomCode }) {
  const inviteLink = `${window.location.origin}/room/${roomCode}`;
  const { copied: codeCopied, copy: copyCode } = useClipboard();
  const { copied: linkCopied, copy: copyLink } = useClipboard();
  const { isSupported: shareSupported, share } = useShare();
  const { isDark } = useTheme();

  const shareText = `Join my SyncTube watch party! Room code: ${roomCode}`;

  const handleDownloadQr = () => {
    const svg = document.getElementById('synctube-invite-qr');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synctube-${roomCode}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite friends" description="Share the room code, link, or QR code to bring people in.">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG
              id="synctube-invite-qr"
              value={inviteLink}
              size={140}
              fgColor={isDark ? '#0B0E14' : '#14161F'}
              level="M"
            />
          </div>
          <button
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            <LuDownload className="h-3.5 w-3.5" />
            Download QR code
          </button>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Room code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-center font-mono text-lg font-semibold tracking-[0.3em] text-ink">
              {roomCode}
            </div>
            <Button variant="secondary" size="icon" onClick={() => copyCode(roomCode)} aria-label="Copy room code">
              {codeCopied ? <LuCheck className="h-4 w-4 text-accent" /> : <LuCopy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Invite link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted">
              {inviteLink}
            </div>
            <Button variant="secondary" size="icon" onClick={() => copyLink(inviteLink)} aria-label="Copy invite link">
              {linkCopied ? <LuCheck className="h-4 w-4 text-accent" /> : <LuCopy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${inviteLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex-1"
          >
            <FaWhatsapp className="h-4 w-4 text-[#25D366]" />
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent('Join my SyncTube room')}&body=${encodeURIComponent(`${shareText}\n\n${inviteLink}`)}`}
            className="btn-secondary flex-1"
          >
            <FaEnvelope className="h-4 w-4" />
            Email
          </a>
          {shareSupported ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => share({ title: 'SyncTube', text: shareText, url: inviteLink })}
            >
              <LuShare2 className="h-4 w-4" />
              Share
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
