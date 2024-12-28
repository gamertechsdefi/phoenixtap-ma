'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Bolt, Zap, ChevronsUp } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { boostFunctions } from '@/api/firebase/fireFunctions';
import { useTapManager } from '@/api/firebase/fireFunctions';

// Import BoostCard normally first
import BoostCard from '@/components/cards/BoostCard';

// Dynamic imports for other components
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
    maxTapBoostCount: 0,
    tapMultiplierCount: 0
  });

  // Use the tap manager hook
  const { totalTaps, maxTaps, currentTaps, refreshMaxTaps } = useTapManager(userId);

  // Initialize WebApp on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const webApp = WebApp;
        if (webApp.initDataUnsafe?.user?.id) {
          setUserId(webApp.initDataUnsafe.user.id);
        }
      }
    } catch (error) {
      console.error('Error initializing WebApp:', error);
    }
  }, []);

  const handleCurrentTapBoost = async () => {
    if (!userId || isLoading) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await boostFunctions.applyCurrentTapBoost(userId);
      if (result.success) {
        await refreshMaxTaps();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to apply boost');
      console.error('Boost error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxTapBoost = async () => {
    if (!userId || isLoading) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await boostFunctions.applyMaxTapBoost(userId);
      if (result.success) {
        await refreshMaxTaps();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to apply boost');
      console.error('Boost error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiplierBoost = async () => {
    if (!userId || isLoading) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await boostFunctions.applyTapMultiplierBoost(userId);
      if (result.success) {
        await refreshMaxTaps();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to apply boost');
      console.error('Boost error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTapBoostCost = boostFunctions.calculateBoostCost(boostStats.currentTapBoostCount);
  const maxTapBoostCost = boostFunctions.calculateBoostCost(boostStats.maxTapBoostCount);
  const multiplierBoostCost = boostFunctions.calculateBoostCost(boostStats.tapMultiplierCount);

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
              description={`Fill your taps back to maximum (${maxTaps})`}
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

            <BoostCard
              title="Double Tap Multiplier"
              description="Double the taps you get per tap"
              cost={multiplierBoostCost}
              onBoost={handleMultiplierBoost}
              isLoading={isLoading}
              disabled={isLoading || totalTaps < multiplierBoostCost}
              icon={<ChevronsUp className="h-5 w-5" />}
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