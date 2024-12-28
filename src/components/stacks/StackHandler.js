// components/StackTask/StackHandler.js
'use client'

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import WebApp from '@twa-dev/sdk';
import { postEvent } from "@telegram-apps/sdk-react";


export const stackTask = {
  id: 'daily-stack',
  title: "Daily Stack Reward",
  description: "Stack with other users to earn your daily reward",
  xpReward: 100,
  category: "stacks",
  type: "stack"
};

export const useStackAvailability = () => {
  const [stackAvailable, setStackAvailable] = useState(true);
  const [resetTime, setResetTime] = useState(null);

  const checkStackAvailability = async () => {
    try {
      const userId = WebApp.initDataUnsafe?.user?.id;
      const userRef = doc(db, 'users', String(userId));
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastStackTime = userData.lastStackTime?.toDate();

        if (lastStackTime) {
          const nextAvailable = new Date(lastStackTime.getTime() + 24 * 60 * 60 * 1000);
          if (nextAvailable > new Date()) {
            setStackAvailable(false);
            setResetTime(nextAvailable);
          } else {
            setStackAvailable(true);
            setResetTime(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking stack availability:', error);
    }
  };

  useEffect(() => {
    checkStackAvailability();
  }, []);

  return { stackAvailable, resetTime };
};

export const handleStackComplete = async (onTaskComplete) => {
  try {
        postEvent("web_app_share_to_story", {
      media_url: 'https://ibb.co/s663NfC', // URL or base64 string of the image
      text: "Your story text here, up to 2048 characters", // Text for the story
      // widget_link: {
      //     url: "https://yourwebsite.com", // Optional link related to the story
      //     name: "Your Website Name" // Optional name for the link
      // }
  });
  

    // Process reward after sharing
    const userId = WebApp.initDataUnsafe?.user?.id;
    const userRef = doc(db, 'users', String(userId));

    await updateDoc(userRef, {
      lastStackTime: serverTimestamp()
    });

    await onTaskComplete(stackTask);

    return true;
  } catch (error) {
    console.error('Error:', error);
    WebApp.showAlert('Error occurred while sharing');
    return false;
  }
};