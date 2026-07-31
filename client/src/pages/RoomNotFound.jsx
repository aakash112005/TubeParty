import { LuSearchX } from 'react-icons/lu';
import { ErrorPage } from '../components/common/ErrorPage';

export function RoomNotFound({ roomCode }) {
  return (
    <ErrorPage
      icon={<LuSearchX />}
      title="Room not found"
      description={`No active room matches the code "${roomCode}". It may have ended or the code might be mistyped.`}
      actionLabel="Back to home"
    />
  );
}
