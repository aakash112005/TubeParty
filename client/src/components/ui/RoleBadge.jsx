import { FaCrown } from 'react-icons/fa';
import { RiShieldStarFill } from 'react-icons/ri';
import { BsCircleFill, BsEyeFill } from 'react-icons/bs';
import { ROLE_META } from '../../constants/roles';
import { cn } from '../../utils/cn';

const ICONS = {
  crown: FaCrown,
  shield: RiShieldStarFill,
  circle: BsCircleFill,
  eye: BsEyeFill,
};

export function RoleBadge({ role, size = 'md' }) {
  const meta = ROLE_META[role];
  if (!meta) return null;

  const Icon = ICONS[meta.iconKey];
  const isSmall = size === 'sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        meta.className,
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Icon className={isSmall ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {meta.label}
    </span>
  );
}
