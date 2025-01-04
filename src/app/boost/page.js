'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bolt, Zap } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import BoostCard from '@/components/cards/BoostCard';
import { boostFunctions } from "@/api/firebase/functions/boostFunction";
import { useTapManager } from '@/api/firebase/functions/userTapManager';

// Dynamic imports
const WebApp = dynamic(() => import('@twa-dev/sdk'), {
  ssr: false
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-16" />
});

const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), {
  ssr: false
});

function BoostPage() {
  const [userId, setUserId] = useState(null);
  const [boostStats, setBoostStats] = useState({
    currentTapBoostCount: 0,
    maxTapBoostCount: 0
  });
  const [isCurrentTapBoosting, setIsCurrentTapBoosting] = useState(false);
  const [isMaxTapBoosting, setIsMaxTapBoosting] = useState(false);
  const [error, setError] = useState(null);

  // Use the tap manager hook
  const { 
    totalTaps, 
    maxTaps, 
    currentTaps, 
    refreshMaxTaps,
    refreshTaps
  } = useTapManager(userId);

  // Initialize and load boost stats
  useEffect(() => {
    async function initializeApp() {
      try {
        if (typeof window !== 'undefined') {
          const telegram = await import('@twa-dev/sdk');
          const webApp = telegram.default;
          
          if (webApp.initDataUnsafe?.user?.id) {
            const uid = String(webApp.initDataUnsafe.user.id);
            setUserId(uid);
            
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setBoostStats({
                currentTapBoostCount: userData.stats?.currentTapBoostCount || 0,
                maxTapBoostCount: userData.stats?.maxTapBoostCount || 0
              });
            }
          }
        }
      } catch (err) {
        console.error('Error in initialization:', err);
        setError('Failed to initialize app');
      }
    }

    initializeApp();
  }, []);

  async function handleCurrentTapBoost() {
    if (!userId || isCurrentTapBoosting) return;
    
    setIsCurrentTapBoosting(true);
    setError(null);
    
    try {
      const result = await boostFunctions.applyCurrentTapBoost(userId);
      
      if (result.success) {
        // Update local state
        setBoostStats(prev => ({
          ...prev,
          currentTapBoostCount: (prev.currentTapBoostCount || 0) + 1
        }));

        // Refresh all tap states
        await Promise.all([
          refreshMaxTaps(),
          refreshTaps && refreshTaps()
        ]);

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
  }

  async function handleMaxTapBoost() {
    if (!userId || isMaxTapBoosting) return;
    
    setIsMaxTapBoosting(true);
    setError(null);
    
    try {
      const result = await boostFunctions.applyMaxTapBoost(userId);
      
      if (result.success) {
        // Update local state
        setBoostStats(prev => ({
          ...prev,
          maxTapBoostCount: (prev.maxTapBoostCount || 0) + 1
        }));

        // Refresh all tap states
        await Promise.all([
          refreshMaxTaps(),
          refreshTaps && refreshTaps()
        ]);
        
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
  }

  const currentTapBoostCost = boostFunctions.calculateBoostCost(boostStats.currentTapBoostCount);
  const maxTapBoostCost = boostFunctions.calculateBoostCost(boostStats.maxTapBoostCount);

  return (
    <SafeAreaContainer>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow p-4">
          {/* Points Display */}
          <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 shadow-md mb-6">
            <h2 className="text-orange-400 font-bold flex items-center gap-2">
              <span>Total Points:</span>
              <span className="text-xl">{totalTaps?.toLocaleString() || 0}</span>
            </h2>
          </div>

          {/* Boost Cards */}
          <div className="space-y-3">
            <BoostCard
              title="Refill Current Taps"
              cost={currentTapBoostCost}
              onBoost={handleCurrentTapBoost}
              isLoading={isCurrentTapBoosting}
              disabled={
                isCurrentTapBoosting || 
                totalTaps < currentTapBoostCost || 
                currentTaps >= maxTaps
              }
              icon={<Bolt className="h-5 w-5" />}
            />

            <BoostCard
              title="Increase Max Taps"
              cost={maxTapBoostCost}
              onBoost={handleMaxTapBoost}
              isLoading={isMaxTapBoosting}
              disabled={
                isMaxTapBoosting || 
                totalTaps < maxTapBoostCost
              }
              icon={<Zap className="h-5 w-5" />}
            />
          </div>

          {/* Error Display */}
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