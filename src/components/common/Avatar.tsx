import { User } from '../../types/user.types';

interface AvatarProps {
  user?: Pick<User, 'name' | 'avatar'> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-emerald-100 ${className}`}
      />
    );
  }

  const initials = user ? getInitials(user.name) : '?';

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold flex items-center justify-center ring-2 ring-emerald-100 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
