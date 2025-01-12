import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import { Trophy, Share2, PlayCircle } from 'lucide-react';
import WebApp from "@twa-dev/sdk";

const StackComponent = ({ userId, onTaskComplete }) => {
    const [stackState, setStackState] = useState({
        isAvailable: false,
        lastClaimed: null,
        nextAvailable: null,
        currentStreak: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState(null);

    useEffect(() => {
        if (userId) {
            checkStackAvailability();
        }
    }, [userId]);

    const checkStackAvailability = async () => {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            const lastClaimTime = userData.lastStackClaim?.toDate();
            const now = new Date();

            // Check if 24 hours have passed since last claim
            let isAvailable = true;
            let nextAvailable = now;

            if (lastClaimTime) {
                const timeDiff = now - lastClaimTime;
                const hoursPassed = timeDiff / (1000 * 60 * 60);
                isAvailable = hoursPassed >= 24;

                if (!isAvailable) {
                    nextAvailable = new Date(lastClaimTime.getTime() + (24 * 60 * 60 * 1000));
                }
            }

            setStackState({
                isAvailable,
                lastClaimed: lastClaimTime,
                nextAvailable,
                currentStreak: userData.stackStreak || 0
            });
        } catch (error) {
            console.error('Error checking stack availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWatchAd = async () => {
        setActiveTask('ad');
        try {
            // Simulate ad watching - in production, integrate with your ad provider
            await new Promise(resolve => setTimeout(resolve, 2000));

            await updateStackState('ad');
            onTaskComplete?.({
                id: 'stack_ad',
                type: 'stack',
                title: 'Watch Ad',
                xpReward: 50
            });
        } catch (error) {
            console.error('Error watching ad:', error);
        } finally {
            setActiveTask(null);
        }
    };

    const handleShareStory = async () => {
        try {
            // Determine the platform
            const platform = WebApp.platform || 'unknown';
            console.log('Platform:', platform);
    
            // Check if the platform supports story sharing
            const supportsStory = ['ios', 'android'].includes(platform);
            if (!supportsStory) {
                WebApp.showPopup({
                    title: 'Unsupported',
                    message: `Story sharing is not supported on this platform (${platform}).`,
                    buttons: [{ text: 'OK', type: 'ok' }],
                });
                return;
            }
    
            const mediaUrl = 'https://i.postimg.cc/p97bzHvR/image.png'; // Example media URL
            console.log('Attempting to share story with media URL:', mediaUrl);
    
            // Share to story using WebApp.shareMessage()
            await WebApp.shareMessage({
                media_url: mediaUrl,
                text: 'Join me in Phoenix Tap! 🎮✨ Play now and see if you can top the leaderboard!',
                widget_link: {} // Optional, can be left empty if no link back is needed
            });
    
            console.log('Story shared successfully!');
        } catch (error) {
            console.error('Error during story sharing:', error);
            WebApp.showPopup({
                title: 'Failed',
                message: `Error occurred: ${error.message || 'Unknown error'}`,
                buttons: [{ text: 'OK', type: 'ok' }],
            });
        }
    };




    const updateStackState = async (taskType) => {
        const userRef = doc(db, 'users', userId);
        const now = serverTimestamp();

        await updateDoc(userRef, {
            lastStackClaim: now,
            stackStreak: stackState.currentStreak + 1,
            [`stackTasks.${taskType}`]: now
        });

        await checkStackAvailability();
    };

    if (loading) {
        return (
            <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-neutral-800 rounded w-1/2" />
            </div>
        );
    }

    if (!stackState.isAvailable) {
        const timeLeft = stackState.nextAvailable - new Date();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        return (
            <div className="bg-neutral-900 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                        <h3 className="font-semibold mb-1">Stack Unavailable</h3>
                        <p className="text-sm text-neutral-400">
                            Next stack available in {hoursLeft}h {minutesLeft}m
                        </p>
                        {stackState.currentStreak > 0 && (
                            <p className="mt-2 text-sm text-orange-500">
                                🔥 Current streak: {stackState.currentStreak} days
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-orange-500 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span>Daily Stack</span>
                    {stackState.currentStreak > 0 && (
                        <span className="text-sm">🔥 {stackState.currentStreak} days</span>
                    )}
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleWatchAd}
                    disabled={activeTask === 'ad'}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg
            ${activeTask === 'ad'
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                        } transition-colors duration-200`}
                >
                    <PlayCircle className="h-5 w-5" />
                    <span>Watch Ad</span>
                </button>

                <button
                    onClick={handleShareStory}
                    disabled={activeTask === 'share'}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg
            ${activeTask === 'share'
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                        } transition-colors duration-200`}
                >
                    <Share2 className="h-5 w-5" />
                    <span>Share Story</span>
                </button>
            </div>

            <p className="text-sm text-neutral-400 text-center">
                Complete tasks to earn XP and maintain your streak!
            </p>
        </div>
    );
};

export default StackComponent;