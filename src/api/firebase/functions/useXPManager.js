import { useState, useEffect, useCallback } from 'react';
import { xpManager } from '@/api/firebase/functions/xpManager';

export const useXPManager = (userId) => {
  const [totalXP, setTotalXP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchInitialXP = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const xp = await xpManager.fetchXP(userId);
        if (mounted) {
          setTotalXP(xp);
        }
      } catch (error) {
        console.error('Error fetching initial XP:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialXP();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const updateXP = useCallback(async (xpToAdd) => {
    if (!userId || !xpToAdd) return false;

    try {
      setIsLoading(true);
      const success = await xpManager.updateXP(userId, xpToAdd);
      
      if (success) {
        setTotalXP(prev => prev + xpToAdd);
      }
      
      return success;
    } catch (error) {
      console.error('Error in updateXP:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    totalXP,
    isLoading,
    updateXP
  };
};