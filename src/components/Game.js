'use client';
// components/Game.tsx

import { useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import Image from 'next/image';
import tapImage from "@/app/images/clicker.png";
import UserProfile from '@/components/UserProfile';
import Footer from '@/components/Footer';
import { initializeUser } from '@/api/firebase/triggers';
import { useTapManager } from '@/api/firebase/functions/userTapManager';
import SafeAreaContainer from '@/components/SafeAreaContainer';

export default function Game() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);

  const userId = WebApp.initDataUnsafe?.user?.id;
  const { currentTaps, totalTaps, pendingTotalTaps, handleTap, maxTaps } = useTapManager(userId);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (!WebApp) throw new Error("Run this app in a telegram environment");
        
        WebApp.ready();
        const user = WebApp.initDataUnsafe?.user;
        if (!user) throw new Error("User data not available");

        await initializeUser(user);
        if (mounted) setIsLoading(false);
      } catch (error) {
        console.error("Initialization error:", error);
        if (mounted) {
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  const triggerTapAnimation = useCallback(() => {
    setTapAnimation(true);
    const timer = setTimeout(() => setTapAnimation(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const onTap = useCallback(async () => {
    if (isTapping || isLoading || currentTaps <= 0) return;

    setIsTapping(true);
    triggerTapAnimation();

    try {
      const success = await handleTap();
      if (!success) console.log('Tap failed: system is recharging or limit reached');
    } catch (error) {
      console.error('Tap error:', error);
    } finally {
      setTimeout(() => setIsTapping(false), 50);
    }
  }, [isTapping, isLoading, currentTaps, handleTap, triggerTapAnimation]);

  const isButtonDisabled = isTapping || isLoading || currentTaps <= 0;
  const progressPercentage = maxTaps ? (currentTaps / maxTaps) * 100 : 0;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 p-4 text-center bg-red-100 rounded-lg max-w-sm mx-auto">
          {error}
        </div>
      </div>
    );
  }

  return (
    <SafeAreaContainer>
      <div className='min-h-screen flex flex-col'>
        <main className='flex-grow'>
          <UserProfile />

          <div className='flex flex-col items-center px-4 max-w-md mx-auto'>
            <div className='text-center mb-6'>
              <h2 className='text-lg font-medium text-gray-300'>Total Taps</h2>
              <h1 className='text-4xl font-bold text-[#f9f9f9]'>{totalTaps}</h1>
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
                <span>Available Taps</span>
                <span>{currentTaps}/{maxTaps}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {currentTaps === 0 && (
              <div className="text-orange-500 mt-4 text-sm font-medium animate-pulse">
                Recharging taps...
              </div>
            )}
            {currentTaps === maxTaps && (
              <div className="text-green-500 mt-4 text-sm font-medium">
                Taps fully charged!
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </SafeAreaContainer>
  );
}