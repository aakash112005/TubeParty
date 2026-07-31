import { useState } from 'react';
import { motion } from 'framer-motion';
import { LuUser, LuArrowRight } from 'react-icons/lu';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Logo } from '../common/Logo';

export function JoinGate({ roomCode, onSubmit }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim().length < 2) {
      return setError('Enter a username with at least 2 characters.');
    }
    onSubmit(username.trim());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8">
        <Logo />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-sm p-6 text-center"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted">You've been invited to</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.2em] text-primary">{roomCode}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <Input
            id="join-username"
            label="Choose a username"
            icon={<LuUser className="h-4 w-4" />}
            placeholder="e.g. Aakash"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg">
            Join Room
            <LuArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
