import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { LOCAL_STORAGE_KEYS, MAX_RECENT_ROOMS } from '../constants/app';

export function useRecentRooms() {
  const [recentRooms, setRecentRooms] = useLocalStorage(LOCAL_STORAGE_KEYS.RECENT_ROOMS, []);

  const addRecentRoom = useCallback(
    (roomCode) => {
      setRecentRooms((prev) => {
        const withoutDuplicate = prev.filter((r) => r.code !== roomCode);
        const next = [{ code: roomCode, joinedAt: Date.now() }, ...withoutDuplicate];
        return next.slice(0, MAX_RECENT_ROOMS);
      });
    },
    [setRecentRooms]
  );

  const clearRecentRooms = useCallback(() => setRecentRooms([]), [setRecentRooms]);

  return { recentRooms, addRecentRoom, clearRecentRooms };
}
