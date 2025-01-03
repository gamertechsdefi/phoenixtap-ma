'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import WebApp from '@twa-dev/sdk';
import { Medal } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import components
const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-16" />
});

const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), {
  ssr: false
});

const LeaderboardCard = ({ rank, username, totalTaps, isCurrentUser }) => {
  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-400';  // Gold
      case 2: return 'text-gray-300';    // Silver
      case 3: return 'text-amber-600';   // Bronze
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`
      p-4 rounded-lg mb-2 transition-all duration-200
      ${isCurrentUser ? 'bg-orange-500 bg-opacity-20' : 'bg-neutral-800 bg-opacity-50'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${getMedalColor(rank)}`}>
            {rank <= 3 ? (
              <Medal size={20} />
            ) : (
              <span className="text-sm font-medium">{rank}</span>
            )}
          </div>
          <div>
            <span className="font-medium text-white">
              {username || 'Anonymous User'}
            </span>
            {isCurrentUser && (
              <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            {totalTaps.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const LeaderboardSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-neutral-800 bg-opacity-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-700 rounded-full" />
            <div className="h-4 w-32 bg-neutral-700 rounded" />
          </div>
          <div className="h-4 w-20 bg-neutral-700 rounded" />
        </div>
      </div>
    ))}
  </div>
);



export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('allTime');
  const currentUserId = WebApp.initDataUnsafe?.user?.id?.toString();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('stats.totalTaps', 'desc'),
          limit(100)
        );

        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          username: doc.data().username || doc.data().firstName,
          totalTaps: doc.data().stats?.totalTaps || 0
        }));

        setLeaderboardData(users);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [activeTab]);

  const currentUserRank = leaderboardData.find(user => user.id === currentUserId)?.rank || 'N/A';

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-pulse">Loading...</div>
      </div>
    }>
      <SafeAreaContainer>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <div className="max-w-lg mx-auto p-4">
              {/* User's Current Rank */}
              <div className="bg-neutral-100 text-neutral-900 rounded-lg p-4 mb-6">
                <div className="text-sm text-black mb-1">Your Rank</div>
                <div className="text-2xl font-bold text-neutral-600">
                  {isLoading ? '...' : `#${currentUserRank}`}
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-2 mb-6">
                {isLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  leaderboardData.map((user) => (
                    <LeaderboardCard
                      key={user.id}
                      rank={user.rank}
                      username={user.username}
                      totalTaps={user.totalTaps}
                      isCurrentUser={user.id === currentUserId}
                    />
                  ))
                )}
              </div>

              {!isLoading && leaderboardData.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No data available
                </div>
              )}
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