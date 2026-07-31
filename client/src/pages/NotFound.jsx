import { LuCompass } from 'react-icons/lu';
import { ErrorPage } from '../components/common/ErrorPage';

export function NotFound() {
  return (
    <ErrorPage
      icon={<LuCompass />}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  );
}
