'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import tapImage from "@/app/images/clicker.png";
import { useTapManager } from '@/api/firebase/functions/userTapManager';

// Dynamic imports with SSR disabled
const WebApp = dynamic(() => import('@twa-dev/sdk'), { ssr: false });
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), { ssr: false });

export default function Game() {
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [userId, setUserId] = useState(null);

  // Initialize user ID from WebApp
  useEffect(() => {
    const initUser = async () => {
      try {
        const telegram = (await import('@twa-dev/sdk')).default;
        const uid = telegram.initDataUnsafe?.user?.id;
        if (uid) setUserId(uid);
      } catch (err) {
        console.error('Error getting user ID:', err);
      }
    };

    initUser();
  }, []);

  const { current, totalTaps, handleTap, maxTaps } = useTapManager(userId);

  const triggerTapAnimation = useCallback(() => {
    setTapAnimation(true);
    const timer = setTimeout(() => setTapAnimation(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const onTap = useCallback(async () => {
    if (isTapping || current <= 0) return;

    setIsTapping(true);
    triggerTapAnimation();

    try {
      await handleTap();
    } catch (error) {
      console.error('Tap error:', error);
    } finally {
      setTimeout(() => setIsTapping(false), 50);
    }
  }, [isTapping, current, handleTap, triggerTapAnimation]);

  const isButtonDisabled = isTapping || current <= 0;
  const progressPercentage = maxTaps ? (current / maxTaps) * 100 : 0;

  return (
    <SafeAreaContainer>
      <div className='min-h-screen flex flex-col'>
        <main className='flex-grow'>
          <UserProfile />

          <div className='flex flex-col items-center px-4 max-w-md mx-auto'>
            <div className='text-center mb-6'>
              <h2 className='text-lg font-medium text-gray-300'>Total Taps</h2>
              <h1 className='text-4xl font-bold text-[#f9f9f9]'>{totalTaps?.toLocaleString()}</h1>
            </div>

            <button
              onClick={onTap}
              disabled={isButtonDisabled}
              className={`relative transform transition-all duration-150 select-none
                ${tapAnimation ? 'scale-95' : 'scale-100'}
                ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer hover:scale-105'}
                active:scale-95`}
            >
              <Image
                src={tapImage}
                width={250}
                height={250}
                alt="Tap here"
                className="drop-shadow-lg pointer-events-none"
                priority
                draggable={false}
              />
            </button>

            <div className="mt-8 w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Available Energy</span>
                <span>{current?.toLocaleString() || 0}/{maxTaps?.toLocaleString() || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {current === 0 && (
              <div className="text-orange-500 mt-4 text-sm font-medium animate-pulse">
                Recharging energy...
              </div>
            )}
            {current === maxTaps && (
              <div className="text-green-500 mt-4 text-sm font-medium">
                Energy fully charged!
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </SafeAreaContainer>
  );
}