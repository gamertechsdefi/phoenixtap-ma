'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import WebApp from '@twa-dev/sdk';
import { referralSystem } from '@/api/firebase/functions/referralSystem';
import {motion} from "framer-motion";

const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), {
  ssr: false
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-16" />
});


const BOT_USERNAME = 'PhoenixClicker_Bot';

const LoadingCard = () => (
  <div className="bg-neutral-800 rounded-lg p-6 animate-pulse">
    <div className="h-6 w-1/3 bg-neutral-700 rounded mb-4" />
    <div className="h-12 w-full bg-neutral-700 rounded" />
  </div>
);

export default function ReferralPage() {
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twaInstance, setTwaInstance] = useState(null);

  useEffect(() => {
    try {
      const webApp = WebApp;
      setTwaInstance(webApp);
      if (webApp.initDataUnsafe?.user?.id) {
        setUserId(webApp.initDataUnsafe.user.id);
      }
    } catch (error) {
      console.error('Error initializing WebApp:', error);
    }
  }, []);

  useEffect(() => {
    async function initializeReferral() {
      if (!userId) return;
      try {
        await referralSystem.initializeReferralCode(userId);
        const stats = await referralSystem.getReferralStats(userId);
        setReferralStats(stats);
      } catch (error) {
        console.error('Error initializing referral:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) initializeReferral();
  }, [userId]);

  const handleCopy = async () => {
    if (!referralStats?.referralCode) return;
    try {
      const shareText = `Join Phoenix App and earn rewards!\n\nUse my referral code: ${referralStats.referralCode}\n\nJoin here: https://t.me/${BOT_USERNAME}?start=${referralStats.referralCode}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    if (!referralStats?.referralCode || !twaInstance) return;
    const shareText = `Join Phoenix App and earn rewards!\n\nUse my referral code: ${referralStats.referralCode}\n\nJoin here: https://t.me/${BOT_USERNAME}?start=${referralStats.referralCode}`;
    try {
      twaInstance.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareText)}`);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }; 

  return (
    <Suspense fallback={<LoadingCard />}>
      <SafeAreaContainer>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow p-4 space-y-6">
            <Suspense fallback={<LoadingCard />}>
              <motion.div
                className="bg-neutral-800 rounded-lg p-6 border-2 border-orange-500"
                whileHover={{ scale: 1.02 }}
              >
                <h2 className="text-xl font-bold text-orange-400 mb-4">Your Referral Code</h2>
                <div className="flex items-center justify-between bg-neutral-900 p-3 rounded-lg mb-4">
                  <span className="font-mono text-lg">{referralStats?.referralCode}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="bg-orange-500 px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="bg-orange-500 px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Share
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-400 break-all">
                  Your referral link:
                  <span className="text-orange-400 ml-1">
                    https://t.me/{BOT_USERNAME}?start={referralStats?.referralCode}
                  </span>
                </div>
              </motion.div>
            </Suspense>

            <div className="grid grid-cols-2 gap-4">
              <Suspense fallback={<LoadingCard />}>
                <motion.div
                  className="bg-neutral-800 p-4 rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-sm text-gray-400">Total Referrals</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {referralStats?.referralsCount || 0}
                  </p>
                </motion.div>
              </Suspense>

              <Suspense fallback={<LoadingCard />}>
                <motion.div
                  className="bg-neutral-800 p-4 rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-sm text-gray-400">Total Referral Rewards</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {referralStats?.totalRewards || 0} XP
                  </p>
                </motion.div>
              </Suspense>
            </div>

            <div className="bg-neutral-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-400 mb-2">How it works</h3>
              <ul className="space-y-2 text-sm">
                <li>• Share your code with friends</li>
                <li>• They click your referral link</li>
                <li>• You get 100 XP for each referral</li>
                <li>• They get 50 XP bonus</li>
              </ul>
            </div>
          </main>
          <Suspense fallback={<div className="h-16" />}>
            <Footer />
          </Suspense>
        </div>
      </SafeAreaContainer>
    </Suspense>
  );
}