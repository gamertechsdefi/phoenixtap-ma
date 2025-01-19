import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Zap, Gift, Target, Users  } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  const isActive = useCallback((path) => {
    return pathname === path;
  }, [pathname]);

  const navigationItems = [
    { 
      href: '/tap', 
      icon: <Home size={24} />, 
      label: 'Home',
      match: '/tap'
    },
    { 
      href: '/boost', 
      icon: <Zap size={20} />, 
      label: 'Boost',
      match: '/boost'
    },
    { 
      href: '/tasks', 
      icon: <Target size={20} />, 
      label: 'Tasks',
      match: '/tasks'
    },
    { 
      href: '/friends', 
      icon: <Users size={20} />, 
      label: 'Friends',
      match: '/friends'
    },
    { 
      href: '/leaderboard', 
      icon: <Trophy size={20} />, 
      label: 'Rank',
      match: '/leaderboard'
    }
  ];

  return (
    <footer className="fixed bottom-2 left-4 right-4 bg-gradient-to-b from-neutral-800 rounded-md to-black bg-opacity-95 backdrop-blur-md">
      <nav className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-3 px-2 transition-colors ${
                isActive(item.match)
                  ? 'text-orange-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Safe area padding for mobile devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </footer>
  );
}