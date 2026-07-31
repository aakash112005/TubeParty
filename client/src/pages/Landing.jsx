import { motion } from 'framer-motion';
import { LuRadio, LuUsers, LuShield, LuMessageCircle } from 'react-icons/lu';
import { Logo } from '../components/common/Logo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { HeroBackground } from '../components/landing/HeroBackground';
import { RoomEntryCard } from '../components/landing/RoomEntryCard';
import { RecentRooms } from '../components/landing/RecentRooms';
import { FeatureCard } from '../components/landing/FeatureCard';
import { useRecentRooms } from '../hooks/useRecentRooms';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: <LuRadio className="h-5 w-5" />,
    title: 'Instant sync',
    description: 'Play, pause, seek, or switch videos and everyone in the room sees it immediately over Socket.IO.',
  },
  {
    icon: <LuUsers className="h-5 w-5" />,
    title: 'Role-based control',
    description: 'Hosts and moderators drive playback. Participants and viewers just sit back and watch.',
  },
  {
    icon: <LuShield className="h-5 w-5" />,
    title: 'No sign-up needed',
    description: 'Pick a username, create or join a room, and you are in. Nothing to register, nothing to remember.',
  },
  {
    icon: <LuMessageCircle className="h-5 w-5" />,
    title: 'Chat & reactions',
    description: 'React live with emoji, chat alongside the video, and follow an activity feed of everything happening.',
  },
];

export function Landing() {
  const { recentRooms, clearRecentRooms } = useRecentRooms();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroBackground />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-8 text-center">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
          Powered by Socket.IO
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl"
        >
          Watch YouTube together, <span className="text-primary">in real time</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-lg text-base text-muted"
        >
          Create a room, share the code, and stay perfectly in sync with everyone watching -
          no downloads, no accounts, just a shared play button.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex w-full flex-col items-center gap-4"
        >
          <RoomEntryCard />
          {recentRooms.length > 0 ? (
            <div className="w-full max-w-md">
              <RecentRooms
                rooms={recentRooms}
                onRejoin={(code) => navigate(`/room/${code}`)}
                onClear={clearRecentRooms}
              />
            </div>
          ) : null}
        </motion.div>

        <div className="mt-28 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} delay={i * 0.08} />
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-8 text-center text-xs text-muted">
        Built with React, Node.js, and Socket.IO.
      </footer>
    </div>
  );
}
