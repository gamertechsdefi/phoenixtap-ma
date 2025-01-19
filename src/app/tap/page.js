'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { db } from '@/api/firebase/triggers';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import tapImage from "@/app/images/clicker.png";
import logoIcon from "@/app/images/phoenix-logo.png";
import profile from "@/app/images/profile.png";
import { useTapManager } from '@/api/firebase/functions/userTapManager';
import { xpManager } from '@/api/firebase/fireFunctions';

import { Crown } from 'lucide-react';
import { Star } from 'lucide-react';

// Dynamic imports with SSR disabled
const WebApp = dynamic(() => import('@twa-dev/sdk'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), { ssr: false });

export default function Game() {
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [userXP, setUserXP] = useState(null);

  // Initialize user ID from WebApp
  useEffect(() => {
    const initUser = async () => {
      try {
        const telegram = (await import('@twa-dev/sdk')).default;
        const uid = telegram.initDataUnsafe?.user?.id;
        const fetchedUserName = telegram.initDataUnsafe?.user?.username;
        const username = fetchedUserName.replace(/[^a-zA-Z]/g, '');

        const userXP = await xpManager.fetchXP(uid);
        if (uid) {
          setUserId(uid);
          setUsername(username);
          setUserXP(userXP);
        }
        ;
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

          <div className='flex flex-col items-center px-4 max-w-md mx-auto'>
            <div className='text-center bg-[#2f1111] rounded-md bg-opacity-80 p-2 mt-4 mb-2 w-full'>
              <h2 className='font-medium text-[#ff6534]'>Total Earnings</h2>
              <div className='flex flex-row gap-4 justify-center items-center '>
                <Image src={logoIcon} width={100} className='w-8 h-8' />
                <h1 className='text-4xl font-bold text-[#f9f9f9]'>{totalTaps?.toLocaleString()}</h1>
              </div>
            </div>

            <div className='flex flex-row gap-2 w-full h-12'>
              <div className='w-3/6 flex flex-row gap-2 p-2 items-center bg-[#2f1111] rounded-md bg-opacity-80'>
                <Image src={profile} className='rounded-sm w-10 h-10' />
                <p className='text-sm font-bold'>{username}</p>
              </div>
              <div className='w-2/6 flex flex-row items-center  gap-2 p-2  bg-[#2f1111] rounded-md bg-opacity-80'>
                <Star
                  color="#FFD700"
                  size={24}
                  fill="#FFD700"
                  strokeWidth={0}
                />
                <p className='font-bold text-sm'>{userXP}</p>
              </div>

              <div className='w-1/6 bg-[#2f1111] rounded-md bg-opacity-80 flex items-center justify-center'>
                <h1 className='font-bold text-3xl text-neutral-200'>!</h1>
              </div>
            </div>

            <button
              onClick={onTap}
              disabled={isButtonDisabled}
              className={`mt-8 relative transform transition-all duration-150 select-none
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

            <div className="mt-3 w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Available Energy</span>
                <span>{current?.toLocaleString() || 0}/{maxTaps?.toLocaleString() || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#fc6808] h-2.5 rounded-full transition-all duration-300 ease-out"
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