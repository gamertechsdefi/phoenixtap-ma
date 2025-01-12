'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WebApp from '@twa-dev/sdk';
import { initializeUser } from '@/api/firebase/triggers';

export default function Page() {
  const router = useRouter();
  const [isInTelegram, setIsInTelegram] = useState(false); // Start with false

  useEffect(() => {
    const init = async () => {
      try {
        // More robust check for Telegram environment
        const isTelegram = Boolean(
          window.Telegram?.WebApp?.initData || // Check for Telegram's WebApp initData
          window.Telegram?.WebApp?.initDataUnsafe // Check for unsafe data
          
        );

        setIsInTelegram(isTelegram);

        if (!isTelegram) {
          console.log('Not in Telegram environment');
          return;
        }

        WebApp.ready();
        const user = WebApp.initDataUnsafe?.user;
        
        if (user?.id) {
          await initializeUser(user);
          
          // Only set timer if initialization is successful
          const timer = setTimeout(() => {
            router.push('/tap');
          }, 5000);
          
          return () => clearTimeout(timer);
        }
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
          href="https://t.me/PhoenixClicker_Bot"
          className="mt-4 text-orange-500 underline hover:text-orange-400"
        >
          Open in Telegram
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 overflow-hidden">
      {/* Rest of your component remains the same */}
    </div>
  );
}