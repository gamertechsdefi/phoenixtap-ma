'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WebApp from '@twa-dev/sdk';
import { initializeUser } from '@/api/firebase/triggers';

export default function Page() {
  const router = useRouter();

  const [isInTelegram, setIsInTelegram] = useState(true); // Default to true, we'll check and update

useEffect(() => {
  const init = async () => {
    try {
      // Check if we're in Telegram
      if (!window.Telegram?.WebApp) {
        setIsInTelegram(false);
        return;
      }

      WebApp.ready();
      const user = WebApp.initDataUnsafe?.user;
      
      if (!WebApp.initDataUnsafe) {
        setIsInTelegram(false);
        return;
      }
      
      if (user?.id) {
        await initializeUser(user);
      }

      const timer = setTimeout(() => {
        router.push('/tap');
      }, 5000);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Initialization error:', error);
      setIsInTelegram(false);
    }
  };

  init();
}, [router]);

// Early return if not in Telegram
if (!isInTelegram) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 text-white">
      <h1 className="text-2xl font-bold text-orange-500 mb-4">Phoenix Tap</h1>
      <p className="text-lg">Please launch this app in Telegram</p>
      <a 
        href="https://t.me/your_bot"
        className="mt-4 text-orange-500 underline hover:text-orange-400"
      >
        Open in Telegram
      </a>
    </div>
  );
}


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeat bg-center" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Logo/Title Section */}
        <div className="mb-12 transform animate-fade-in">
          <h1 className="text-6xl font-bold text-orange-500 mb-4">
            Phoenix Tap
          </h1>
          <p className="text-xl text-neutral-400">
            Tap your way to the top
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 w-full h-full border-4 border-orange-500/20 rounded-full" />
            <div className="absolute inset-0 w-full h-full border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-neutral-300 flex items-center space-x-2">
            <span className="animate-pulse">Preparing your game</span>
            <span className="animate-bounce">...</span>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}