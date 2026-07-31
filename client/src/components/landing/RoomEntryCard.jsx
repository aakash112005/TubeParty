import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuUser, LuHash, LuArrowRight } from 'react-icons/lu';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { roomService } from '../../services/api';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useRecentRooms } from '../../hooks/useRecentRooms';
import { LOCAL_STORAGE_KEYS } from '../../constants/app';
import { extractRoomCodeFromInput } from '../../utils/format';

const TABS = { CREATE: 'create', JOIN: 'join' };

export function RoomEntryCard() {
  const navigate = useNavigate();
  const { addRecentRoom } = useRecentRooms();
  const [savedUsername, setSavedUsername] = useLocalStorage(LOCAL_STORAGE_KEYS.USERNAME, '');

  const [activeTab, setActiveTab] = useState(TABS.CREATE);
  const [username, setUsername] = useState(savedUsername);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persistUsername = (value) => {
    setUsername(value);
    setSavedUsername(value);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 2) {
      return setError('Enter a username with at least 2 characters.');
    }

    setLoading(true);
    try {
      const data = await roomService.createRoom(username.trim());
      addRecentRoom(data.roomCode);
      toast.success('Room created!');
      navigate(`/room/${data.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 2) {
      return setError('Enter a username with at least 2 characters.');
    }
    const code = extractRoomCodeFromInput(roomCode);
    if (code.length !== 6) {
      return setError('Room codes are 6 characters long.');
    }

    setLoading(true);
    try {
      await roomService.checkRoom(code);
      addRecentRoom(code);
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card w-full max-w-md p-6">
      <div className="mb-5 flex rounded-xl border border-border bg-surface p-1">
        {[
          { key: TABS.CREATE, label: 'Create Room' },
          { key: TABS.JOIN, label: 'Join Room' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setError('');
            }}
            className="relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {activeTab === tab.key && (
              <motion.span
                layoutId="tab-highlight"
                className="absolute inset-0 rounded-lg bg-primary shadow-glow-primary"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={`relative z-10 ${activeTab === tab.key ? 'text-white' : 'text-muted'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={activeTab === TABS.CREATE ? handleCreateRoom : handleJoinRoom} className="space-y-4">
        <Input
          id="username"
          label="Your username"
          icon={<LuUser className="h-4 w-4" />}
          placeholder="e.g. Aakash"
          value={username}
          onChange={(e) => persistUsername(e.target.value)}
          maxLength={20}
          autoComplete="off"
        />

        {activeTab === TABS.JOIN ? (
          <Input
            id="roomCode"
            label="Room code or invite link"
            icon={<LuHash className="h-4 w-4" />}
            placeholder="ABX72K"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            autoComplete="off"
            className="font-mono uppercase tracking-widest"
          />
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {activeTab === TABS.CREATE ? 'Create Room' : 'Join Room'}
          <LuArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
