'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bolt, Zap } from 'lucide-react';
// Import WebApp dynamically to avoid SSR issues
const WebApp = dynamic(() => import('@twa-dev/sdk'), {
  ssr: false
});

import {boostFunctions} from '@/api/firebase/fireFunctions';
import { useTapManager } from '@/api/firebase/fireFunctions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import BoostCard from '@/components/cards/BoostCard';

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-16" />
});

const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), {
  ssr: false
});

export default function BoostPage() {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [boostStats, setBoostStats] = useState({
    currentTapBoostCount: 0,
    maxTapBoostCount: 0
  });

  // Use the tap manager hook
  const { totalTaps, maxTaps, currentTaps, refreshMaxTaps } = useTapManager(userId);

  // Initialize WebApp and load boost stats
  useEffect(() => {
    const initializeApp = async () => {
      try {
        let uid = null;
        
        // Check if we're in the browser environment
        if (typeof window !== 'undefined') {
          const telegram = await import('@twa-dev/sdk');
          if (telegram.default.initDataUnsafe?.user?.id) {
            uid = telegram.default.initDataUnsafe.user.id.toString();
            setUserId(uid);
          }
        }

        if (uid) {
          // Load boost stats
          try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setBoostStats({
                currentTapBoostCount: userData.stats?.currentTapBoostCount || 0,
                maxTapBoostCount: userData.stats?.maxTapBoostCount || 0
              });
            }
          } catch (error) {
            console.error('Error loading boost stats:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing WebApp:', error);
      }
    };

    initializeApp();
  }, []);

  const handleCurrentTapBoost = async () => {
    if (!userId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting current tap boost for user:', userId);
      const result = await boostFunctions.applyCurrentTapBoost(userId);
      console.log('Boost result:', result);
      
      if (result.success) {
        await refreshMaxTaps();
        setBoostStats(prev => ({
          ...prev,
          currentTapBoostCount: (prev.currentTapBoostCount || 0) + 1
        }));
        // Use dynamic import for WebApp
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
    } catch (error) {
      console.error('Boost error:', error);
      setError('Failed to apply boost');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxTapBoost = async () => {
    if (!userId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting max tap boost for user:', userId);
      const result = await boostFunctions.applyMaxTapBoost(userId);
      console.log('Boost result:', result);
      
      if (result.success) {
        await refreshMaxTaps();
        setBoostStats(prev => ({
          ...prev,
          maxTapBoostCount: (prev.maxTapBoostCount || 0) + 1
        }));
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
    } catch (error) {
      console.error('Boost error:', error);
      setError('Failed to apply boost');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTapBoostCost = boostFunctions.calculateBoostCost(boostStats.currentTapBoostCount);
  const maxTapBoostCost = boostFunctions.calculateBoostCost(boostStats.maxTapBoostCount);

  return (
    <SafeAreaContainer>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow p-4">
          <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 shadow-md mb-6">
            <h2 className="text-orange-400 font-bold flex items-center gap-2">
              <span>Total Points:</span>
              <span className="text-xl">{totalTaps?.toLocaleString() || 0}</span>
            </h2>
          </div>

          <div className="space-y-4">
            <BoostCard
              title="Refill Current Taps"
              description={`Fill your taps back to maximum (${maxTaps?.toLocaleString()})`}
              cost={currentTapBoostCost}
              onBoost={handleCurrentTapBoost}
              isLoading={isLoading}
              disabled={isLoading || totalTaps < currentTapBoostCost || currentTaps >= maxTaps}
              icon={<Bolt className="h-5 w-5" />}
            />

            <BoostCard
              title="Increase Max Taps"
              description="Permanently increase your maximum taps by 500"
              cost={maxTapBoostCost}
              onBoost={handleMaxTapBoost}
              isLoading={isLoading}
              disabled={isLoading || totalTaps < maxTapBoostCost}
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