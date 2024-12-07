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

  // Rest of your component code remains the same...
  const triggerTapAnimation = useCallback(() => {
    setTapAnimation(true);
    const timer = setTimeout(() => setTapAnimation(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const onTap = useCallback(async () => {
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
      setTimeout(() => setIsTapping(false), 50);
    }
  }, [isTapping, isLoading, currentTaps, handleTap, triggerTapAnimation]);

  const isButtonDisabled = isTapping || isLoading || currentTaps <= 0;
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

  // Rest of your JSX remains the same...
  return (
    <div className='min-h-screen flex flex-col'>
      {/* Your existing JSX */}
    </div>
  );
}