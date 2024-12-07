import { useState, useEffect } from 'react';

import {db} from "@/utils/firebase";
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';


export function useTapTracker(userId) {
    const [taps, setTaps] = useState(0);
  
    useEffect(() => {
      const fetchTaps = async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          setTaps(userSnap.data().taps || 0);
        } else {
          await setDoc(userRef, { taps: 0 });
        }
      };
  
      fetchTaps();
    }, [userId]);
  
    const incrementTap = async () => {
      const newTaps = taps + 1;
      setTaps(newTaps);
  
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { taps: newTaps });
    };
  
    return { taps, incrementTap };
  }
  
  export async function claimTokens(userId) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
  
    if (userSnap.exists()) {
      const userTaps = userSnap.data().taps || 0;
      const tokensToAward = Math.floor(userTaps / 10); // 1 token per 10 taps
  
      if (tokensToAward > 0) {
        const remainingTaps = userTaps % 10;
        await updateDoc(userRef, { 
          taps: remainingTaps,
          tokens: (userSnap.data().tokens || 0) + tokensToAward
        });
        return tokensToAward;
      }
    }
  
    return 0;
  }