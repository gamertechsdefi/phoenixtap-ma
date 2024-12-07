'use client';

import { useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import Image from 'next/image';
import tapImage from "@/app/images/clicker.png";
import UserProfile from '@/components/UserProfile';
import Footer from '@/components/Footer';
import { initializeUser } from '@/api/firebase/triggers';
import { useTapManager } from '@/api/firebase/fireFunctions';

export default function Game() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);

  // Get userId from Telegram WebApp
  const userId = WebApp.initDataUnsafe?.user?.id;

  // Use the tap manager hook with all required states
  const { currentTaps, totalTaps, pendingTotalTaps, handleTap } = useTapManager(userId);

  // Initialize app and user data
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Check for Telegram environment
        if (!WebApp) {
          throw new Error("Run this app in a telegram environment");
        }

        // Initialize Telegram WebApp
        WebApp.ready();

        // Get and validate user data
        const user = WebApp.initDataUnsafe?.user;
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

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

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
            <h1 className='text-4xl font-bold text-[#f9f9f9]'>{totalTaps}</h1>
            {/* {pendingTotalTaps > 0 && (
              <p className='text-sm text-gray-500 mt-1'>
                +{pendingTotalTaps} pending
              </p>
            )} */}
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
              <span>{currentTaps}/2500</span>
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