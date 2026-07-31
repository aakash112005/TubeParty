import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { RoomProvider, useRoom } from '../context/RoomContext';
import { useSocket } from '../context/SocketContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRecentRooms } from '../hooks/useRecentRooms';
import { LOCAL_STORAGE_KEYS } from '../constants/app';
import { JoinGate } from '../components/room/JoinGate';
import { RoomHeader } from '../components/room/RoomHeader';
import { ReconnectBanner } from '../components/common/ReconnectBanner';
import { MobileTabBar } from '../components/room/MobileTabBar';
import { ActivityFeed } from '../components/room/ActivityFeed';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { PlaybackControls } from '../components/player/PlaybackControls';
import { VideoStatusBar } from '../components/player/VideoStatusBar';
import { ReactionBar } from '../components/player/ReactionBar';
import { ParticipantsPanel } from '../components/participants/ParticipantsPanel';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ErrorPage } from '../components/common/ErrorPage';
import { LuTriangleAlert } from 'react-icons/lu';
import { PlayerSkeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';
import { RoomNotFound } from './RoomNotFound';

export function Room() {
  const { roomCode } = useParams();
  const [savedUsername] = useLocalStorage(LOCAL_STORAGE_KEYS.USERNAME, '');
  const { addRecentRoom } = useRecentRooms();
  const [activeUsername, setActiveUsername] = useState(savedUsername || null);

  if (!roomCode || !/^[a-zA-Z0-9]{6}$/.test(roomCode)) {
    return <RoomNotFound roomCode={roomCode} />;
  }

  if (!activeUsername) {
    return (
      <JoinGate
        roomCode={roomCode.toUpperCase()}
        onSubmit={(username) => {
          addRecentRoom(roomCode.toUpperCase());
          setActiveUsername(username);
        }}
      />
    );
  }

  return (
    <RoomProvider roomCode={roomCode.toUpperCase()} username={activeUsername}>
      <RoomContent onSwitchUser={() => setActiveUsername(null)} />
    </RoomProvider>
  );
}

function RoomContent({ onSwitchUser }) {
  const { isJoined, joinError, roomCode } = useRoom();
  const { status } = useSocket();
  const [mobileTab, setMobileTab] = useState('watch');

  if (joinError) {
    if (joinError.toLowerCase().includes('not found')) {
      return <RoomNotFound roomCode={roomCode} />;
    }
    return (
      <ErrorPage
        icon={<LuTriangleAlert />}
        title="Couldn't join this room"
        description={joinError}
        actionLabel="Try a different username"
        onAction={onSwitchUser}
      />
    );
  }

  if (!isJoined) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
        <div className="skeleton h-14 w-full rounded-2xl" />
        <PlayerSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <ReconnectBanner status={status} />
      <RoomHeader />

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[280px_1fr_340px] lg:px-6">
        <aside className={cn('lg:block', mobileTab === 'people' ? 'block' : 'hidden')}>
          <div className="space-y-4 lg:sticky lg:top-20">
            <div className="h-[calc(100vh-11rem)] lg:h-[420px]">
              <ParticipantsPanel />
            </div>
            <div className="hidden lg:block">
              <ActivityFeed />
            </div>
          </div>
        </aside>

        <section className={cn('lg:block', mobileTab === 'watch' ? 'block' : 'hidden')}>
          <VideoPlayer />
          <VideoStatusBar />
          <ReactionBar />
          <PlaybackControls />
          <div className="mt-4 lg:hidden">
            <ActivityFeed />
          </div>
        </section>

        <aside className={cn('lg:block', mobileTab === 'chat' ? 'block' : 'hidden')}>
          <div className="h-[calc(100vh-11rem)] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <ChatPanel />
          </div>
        </aside>
      </main>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} roomCode={roomCode} />
    </div>
  );
}
