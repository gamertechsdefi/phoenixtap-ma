'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bolt, Zap } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import BoostCard from '@/components/cards/BoostCard';
import {
  calculateBoostCost,
  applyCurrentTapBoost,
  applyMaxTapBoost
} from "@/api/firebase/functions/boostFunction";

const WebApp = dynamic(() => import('@twa-dev/sdk'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-16" />
});
const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), { ssr: false });

function BoostPage() {
  const [userId, setUserId] = useState(null);
  const [userStats, setUserStats] = useState({
    totalTaps: 0,
    energy: {
      current: 0,
      max: 2500
    },
    boostCounts: {
      currentTapBoostCount: 0,
      maxTapBoostCount: 0
    }
  });
  const [isCurrentTapBoosting, setIsCurrentTapBoosting] = useState(false);
  const [isMaxTapBoosting, setIsMaxTapBoosting] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch latest user stats
  const refreshUserStats = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserStats({
          totalTaps: userData.stats?.totalTaps || 0,
          energy: {
            current: userData.energy?.current || 0,
            max: userData.energy?.max || 2500
          },
          boostCounts: {
            currentTapBoostCount: userData.stats?.currentTapBoostCount || 0,
            maxTapBoostCount: userData.stats?.maxTapBoostCount || 0
          }
        });
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  // Initialize user and stats
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (typeof window !== 'undefined') {
          const telegram = await import('@twa-dev/sdk');
          const webApp = telegram.default;
          
          if (webApp.initDataUnsafe?.user?.id) {
            const uid = String(webApp.initDataUnsafe.user.id);
            setUserId(uid);
            await refreshUserStats(uid);
          }
        }
      } catch (err) {
        console.error('Error in initialization:', err);
        setError('Failed to initialize app');
      }
    };

    initializeApp();
  }, []);

  const handleCurrentTapBoost = async () => {
    if (!userId || isCurrentTapBoosting) return;
    
    setIsCurrentTapBoosting(true);
    setError(null);
    
    try {
      const result = await applyCurrentTapBoost(userId);
      console.log('Current tap boost result:', result);
      
      if (result.success) {
        // Refresh stats after successful boost
        await refreshUserStats(userId);

        const telegram = await import('@twa-dev/sdk');
        telegram.default?.showPopup({
          message: result.message,
          buttons: [{ type: 'ok' }]
        });
      } else {
        setError(result.message);
        const telegram = await import('@twa-dev/sdk');
        telegram.default?.showPopup({
          message: result.message,
          buttons: [{ type: 'ok' }]
        });
      }
    } catch (err) {
      console.error('Boost error:', err);
      setError('Failed to apply boost');
    } finally {
      setIsCurrentTapBoosting(false);
    }
  };

  const handleMaxTapBoost = async () => {
    if (!userId || isMaxTapBoosting) return;
    
    setIsMaxTapBoosting(true);
    setError(null);
    
    try {
      const result = await applyMaxTapBoost(userId);
      console.log('Max tap boost result:', result);
      
      if (result.success) {
        // Refresh stats after successful boost
        await refreshUserStats(userId);
        
        const telegram = await import('@twa-dev/sdk');
        telegram.default?.showPopup({
          message: result.message,
          buttons: [{ type: 'ok' }]
        });
      } else {
        setError(result.message);
        const telegram = await import('@twa-dev/sdk');
        telegram.default?.showPopup({
          message: result.message,
          buttons: [{ type: 'ok' }]
        });
      }
    } catch (err) {
      console.error('Boost error:', err);
      setError('Failed to apply boost');
    } finally {
      setIsMaxTapBoosting(false);
    }
  };

  const currentTapBoostCost = calculateBoostCost(userStats.boostCounts.currentTapBoostCount);
  const maxTapBoostCost = calculateBoostCost(userStats.boostCounts.maxTapBoostCount);

  return (
    <SafeAreaContainer>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow p-4">
          <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 shadow-md mb-6">
            <h2 className="text-orange-400 font-bold flex items-center gap-2">
              <span>Total Points:</span>
              <span className="text-xl">{userStats.totalTaps?.toLocaleString()}</span>
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Current Energy: {userStats.energy.current?.toLocaleString()} / {userStats.energy.max?.toLocaleString()}
            </p>
          </div>

          <div className="space-y-3">
            <BoostCard
              title="Refill Energy"
              cost={currentTapBoostCost}
              onBoost={handleCurrentTapBoost}
              isLoading={isCurrentTapBoosting}
              disabled={
                isCurrentTapBoosting || 
                userStats.totalTaps < currentTapBoostCost || 
                userStats.energy.current >= userStats.energy.max
              }
              icon={<Bolt className="h-5 w-5" />}
            />

            <BoostCard
              title="Increase Max Energy"
              cost={maxTapBoostCost}
              onBoost={handleMaxTapBoost}
              isLoading={isMaxTapBoosting}
              disabled={
                isMaxTapBoosting || 
                userStats.totalTaps < maxTapBoostCost
              }
              icon={<Zap className="h-5 w-5" />}
            />
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-600 rounded-lg">
              {error}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </SafeAreaContainer>
  );
}

export default BoostPage;