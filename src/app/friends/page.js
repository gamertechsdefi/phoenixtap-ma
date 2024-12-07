'use client';

import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { referralSystem } from '@/api/firebase/fireFunctions';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';

const BOT_USERNAME = 'TGgametestminibot';

export default function ReferralPage() {
    const [referralStats, setReferralStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [userId, setUserId] = useState(null);
    const [twaInstance, setTwaInstance] = useState(null);

    // Initialize WebApp
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

    // Handle referral initialization after userId is set
    useEffect(() => {
        const initializeReferral = async () => {
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
        };

        if (userId) {
            initializeReferral();
        }
    }, [userId]);

    const handleCopy = async () => {
        if (!referralStats?.referralCode || typeof navigator === 'undefined') return;

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

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className='flex-grow'>
            <div className="p-4 space-y-6">
                {/* Referral Card */}
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

                    {/* Show referral link */}
                    <div className="mt-2 text-sm text-gray-400 break-all">
                        Your referral link:
                        <span className="text-orange-400 ml-1">
                            https://t.me/{BOT_USERNAME}?start={referralStats?.referralCode}
                        </span>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        className="bg-neutral-800 p-4 rounded-lg text-center"
                        whileHover={{ scale: 1.05 }}
                    >
                        <p className="text-sm text-gray-400">Total Referrals</p>
                        <p className="text-2xl font-bold text-orange-400">
                            {referralStats?.referralsCount || 0}
                        </p>
                    </motion.div>

                    <motion.div
                        className="bg-neutral-800 p-4 rounded-lg text-center"
                        whileHover={{ scale: 1.05 }}
                    >
                        <p className="text-sm text-gray-400">Total Referral Rewards</p>
                        <p className="text-2xl font-bold text-orange-400">
                            {referralStats?.totalRewards || 0} XP
                        </p>
                    </motion.div>
                </div>

                {/* How it works */}
                <div className="bg-neutral-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">How it works</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Share your code with friends</li>
                        <li>• They click your referral link</li>
                        <li>• You get 100 XP for each referral</li>
                        <li>• They get 50 XP bonus</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
}