'use client';

import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { Coins, Trophy, Wallet } from 'lucide-react';
import Footer from '@/components/Footer';
import { userFunctions } from '@/api/firebase/fireFunctions';

const { fetchUserDetails } = userFunctions;

export default function ClaimPage() {
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (WebApp?.initDataUnsafe?.user?.id) {
      setUserId(WebApp.initDataUnsafe.user.id);
    }
  }, []);

  useEffect(() => {
    const getUserDetails = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const result = await fetchUserDetails(userId);
        
        if (result.success) {
          setUserInfo(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    getUserDetails();
  }, [userId]);

  if (error) {
    return (
      <div className="min-h-screen  text-white p-4">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen  text-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-neutral-800 rounded-lg"></div>
          <div className="h-24 bg-neutral-800 rounded-lg"></div>
          <div className="h-24 bg-neutral-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col">
      {/* Profile Header */}
      <div className="p-4 space-y-6 flex-grow">
        <div className="text-center">
          <div className="w-20 h-20 bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">
              {userInfo?.firstName ? userInfo.firstName.charAt(0).toUpperCase() : '?'}
            </span>
          </div>
          <h1 className="text-xl font-bold">
            {userInfo?.firstName} {userInfo?.lastName}
          </h1>
          <p className="text-neutral-400">@{userInfo?.username}</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-900 bg-opacity-40 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Coins className="text-yellow-400" size={24} />
              <div>
                <p className="text-sm text-neutral-400">Total Taps</p>
                <p className="text-lg font-bold">
                  {userInfo?.stats.totalTaps.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 bg-opacity-40 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={24} />
              <div>
                <p className="text-sm text-neutral-400">Total XP</p>
                <p className="text-lg font-bold">
                  {userInfo?.stats.totalXP.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-neutral-900 bg-opacity-40 rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="text-yellow-400" size={24} />
                <div>
                  <p className="text-sm text-neutral-400">Available to Withdraw</p>
                  <p className="text-lg font-bold">
                    {((userInfo?.stats.totalTaps || 0) / 1000).toFixed(2)} PHT
                  </p>
                </div>
              </div>
            </div>
            
            <button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-neutral-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                // Withdraw function will be implemented later
                console.log('Withdraw clicked');
              }}
              disabled={(userInfo?.stats.totalTaps || 0) < 1000}
            >
              Withdraw PHT
            </button>
            
            <p className="text-xs text-center text-neutral-500">
              Minimum withdrawal: 1,000 Taps = 1 PHT
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}