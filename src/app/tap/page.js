'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import tapImage from "@/app/images/clicker.png";

// Dynamically import components
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), { ssr: false });

// Dynamically import API functions
const initializeUser = dynamic(() => import('@/api/firebase/triggers').then(mod => mod.initializeUser), { ssr: false });
const useTapManager = dynamic(() => import('@/api/firebase/functions/userTapManager').then(mod => mod.useTapManager), { ssr: false });

export default function Game() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);

  const [userId, setUserId] = useState(null);
  const [WebApp, setWebApp] = useState(null); // To store the dynamically loaded SDK

  // Dynamically import Telegram SDK
  useEffect(() => {
    const loadSDK = async () => {
      try {
        const WebAppSDK = (await import('@twa-dev/sdk')).default;
        setWebApp(WebAppSDK);
      } catch (err) {
        console.error('Failed to load Telegram SDK:', err);
        setError('Failed to initialize Telegram SDK.');
      }
    };
    loadSDK();
  }, []);

  const { current, totalTaps, pendingTotalTaps, handleTap, maxTaps } = useTapManager(userId || '');

  useEffect(() => {
    const init = async () => {
      try {
        if (!WebApp) return;

        WebApp.ready();
        console.log("WebApp.initDataUnsafe:", WebApp.initDataUnsafe);

        const user = WebApp.initDataUnsafe?.user;
        if (!user) {
          throw new Error("User data not available. Please reopen this app in Telegram.");
        }

        setUserId(user.id);
        await initializeUser(user);
        setIsLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message || 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    init();
  }, [WebApp]);

  const triggerTapAnimation = useCallback(() => {
    setTapAnimation(true);
    const timer = setTimeout(() => setTapAnimation(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const onTap = useCallback(async () => {
    if (isTapping || isLoading || current <= 0) return;

    setIsTapping(true);
    triggerTapAnimation();

    try {
      const success = await handleTap();
      if (!success) console.log('Tap failed: system is recharging or limit reached');
    } catch (err) {
      console.error('Tap error:', err);
    } finally {
      setTimeout(() => setIsTapping(false), 50);
    }
  }, [isTapping, isLoading, current, handleTap, triggerTapAnimation]);

  const isButtonDisabled = isTapping || isLoading || current <= 0;
  const progressPercentage = maxTaps ? (current / maxTaps) * 100 : 0;

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
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <UserProfile />

          <div className="flex flex-col items-center px-4 max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-lg font-medium text-gray-300">Total Taps</h2>
              <h1 className="text-4xl font-bold text-[#f9f9f9]">{totalTaps}</h1>
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
                <span>{current}/{maxTaps}</span>
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
                Recharging taps...
              </div>
            )}
            {current === maxTaps && (
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
