import { useState, useRef, Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { LuSend, LuSmile } from 'react-icons/lu';
import { useRoom } from '../../context/RoomContext';
import { EMOJI_REACTIONS } from '../../constants/app';

export function ChatInput() {
  const { actions, settings } = useRoom();
  const [text, setText] = useState('');
  const typingRef = useRef(false);
  const stopTypingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);

    if (!typingRef.current) {
      typingRef.current = true;
      actions.sendTyping(true);
    }
    clearTimeout(stopTypingTimeoutRef.current);
    stopTypingTimeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      actions.sendTyping(false);
    }, 1500);
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    actions.sendChatMessage(trimmed);
    setText('');
    typingRef.current = false;
    actions.sendTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!settings.chatEnabled) {
    return <p className="px-1 py-2 text-center text-xs text-muted">Chat is disabled in this room.</p>;
  }

  return (
    <div className="flex items-end gap-2">
      <Popover className="relative">
        <Popover.Button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-ink">
          <LuSmile className="h-4 w-4" />
        </Popover.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Panel className="glass-card absolute bottom-12 left-0 z-20 grid grid-cols-4 gap-1 p-2">
            {({ close }) => (
              <>
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setText((t) => t + emoji);
                      close();
                    }}
                    className="rounded-lg p-1.5 text-lg hover:bg-surface-hover"
                  >
                    {emoji}
                  </button>
                ))}
              </>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>

      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        className="input-field max-h-24 min-h-[2.5rem] flex-1 resize-none py-2.5"
      />

      <button
        onClick={send}
        disabled={!text.trim()}
        className="btn-primary flex h-10 w-10 items-center justify-center rounded-xl p-0 disabled:opacity-40"
        aria-label="Send message"
      >
        <LuSend className="h-4 w-4" />
      </button>
    </div>
  );
}
