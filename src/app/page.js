'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import tapImage from "@/app/images/clicker.png";
import UserProfile from '@/components/UserProfile';
import Footer from '@/components/Footer';
import { initializeUser } from '@/api/firebase/triggers';
import { useTapManager } from '@/api/firebase/fireFunctions';

// Dynamically import WebApp with no SSR
const WebApp = dynamic(() => import('@twa-dev/sdk'), { 
  ssr: false,
  loading: () => null
});

export default function Game() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twaInstance, setTwaInstance] = useState(null);

  // Use the tap manager hook with all required states
  const { currentTaps, totalTaps, pendingTotalTaps, handleTap } = useTapManager(userId);

  // Initialize WebApp only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeWebApp = async () => {
      try {
        // Dynamically import WebApp
        const Telegram = (await import('@twa-dev/sdk')).default;
        
        if (!Telegram) {
          throw new Error("Telegram WebApp not available");
        }

        setTwaInstance(Telegram);
        
        if (Telegram.initDataUnsafe?.user?.id) {
          setUserId(Telegram.initDataUnsafe.user.id);
        }
      } catch (error) {
        console.error('Error initializing WebApp:', error);
        setError('Failed to initialize Telegram WebApp');
      }
    };

    initializeWebApp();
  }, []);

  // Initialize app and user data after WebApp is initialized
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!userId || !twaInstance) return;

      try {
        // Initialize Telegram WebApp
        twaInstance.ready();

        // Get and validate user data
        const user = twaInstance.initDataUnsafe?.user;
        if (!user) {
          throw new Error("User data not available");
        }

        // Initialize user in Firebase
        await initializeUser(user);

        // Only update state if component is still mounted
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (mounted) {
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [userId, twaInstance]);

  // Handle tap animation
  const triggerTapAnimation = useCallback(() => {
    setTapAnimation(true);
    const timer = setTimeout(() => setTapAnimation(false), 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle tap action
  const onTap = useCallback(async () => {
    // Guard clauses
    if (isTapping || isLoading || currentTaps <= 0) {
      return;
    }

    setIsTapping(true);
    triggerTapAnimation();

    try {
      const success = await handleTap();
      if (!success) {
        console.log('Tap failed: system is recharging or limit reached');
      }
    } catch (error) {
      console.error('Tap error:', error);
    } finally {
      // Add small delay to prevent spam clicking
      setTimeout(() => setIsTapping(false), 50);
    }
  }, [isTapping, isLoading, currentTaps, handleTap, triggerTapAnimation]);

  // Calculate button disabled state
  const isButtonDisabled = isTapping || isLoading || currentTaps <= 0;

  // Calculate progress percentage
  const progressPercentage = (currentTaps / 2500) * 100;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 p-4 text-center bg-red-100 rounded-lg max-w-sm mx-auto">
          {error}
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-grow'>
        <UserProfile />

        <div className='flex flex-col items-center px-4 max-w-md mx-auto'>
          {/* Total Taps Counter */}
          <div className='text-center mb-6'>
            <h2 className='text-lg font-medium text-gray-300'>Total Taps</h2>
            <h1 className='text-4xl font-bold text-[#f9f9f9]'>{totalTaps || 0}</h1>
          </div>

          {/* Tap Button */}
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

          {/* Current Taps Progress */}
          <div className="mt-8 w-full">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Available Taps</span>
              <span>{currentTaps || 0}/2500</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Status Messages */}
          {currentTaps === 0 && (
            <div className="text-orange-500 mt-4 text-sm font-medium animate-pulse">
              Recharging taps...
            </div>
          )}
          {currentTaps === 2500 && (
            <div className="text-green-500 mt-4 text-sm font-medium">
              Taps fully charged!
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}