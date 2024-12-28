import { useState, useEffect } from 'react';
import Image from 'next/image';
import WebApp from '@twa-dev/sdk';
import { xpManager } from '@/api/firebase/fireFunctions';
import profile from '@/app/images/profile.png';

export default function UserProfile() {
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('user');

  useEffect(() => {
    let mounted = true;

    async function loadUserData() {
      try {
        // Get user ID and name from Telegram WebApp
        const initData = WebApp.initDataUnsafe;
        const userId = initData?.user?.id;
        setUsername(initData?.user?.first_name || 'user');

        if (userId) {
          // Fetch XP using xpManager
          const userXP = await xpManager.fetchXP(userId);
          if (mounted) {
            setTotalXP(userXP);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (mounted) {
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUserData();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="p-2 m-4 rounded-lg bg-red-100">
        <p className="text-red-600">Error loading profile: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-2 m-4 sticky top-0 rounded-lg bg-[#f9f9f9]">
      <div className="flex flex-row justify-between items-center">
        <div className="flex gap-2 items-center">
          <Image 
            className="rounded-lg w-12 h-12" 
            src={profile} 
            alt="User profile"
            priority 
          />
          <p className="font-bold text-neutral-900">{username}</p>
        </div>

        <div className="flex">
          <h2 className="font-bold text-orange-600">
            <span className="pl-4">
              {loading ? '...' : `${totalXP.toLocaleString()} xp`}
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
}