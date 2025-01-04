import {
    doc,
    getDoc,
    getDocs,
    updateDoc,
    collection,
    query,
    where,
    writeBatch,
    deleteField,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import { XP_CONFIG } from '@/api/firebase/constants';

const generateReferralCode = (userId) => {
    const prefix = 'PHX';
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${randomPart}`;
};

export const referralSystem = {
    async processReferral(newUserId) {
        try {
            const newUserRef = doc(db, 'users', String(newUserId));
            const newUserDoc = await getDoc(newUserRef);

            if (!newUserDoc.exists()) return false;

            const userData = newUserDoc.data();
            if (!userData.pendingReferralCode || userData.referredBy) return false;

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('referralCode', '==', userData.pendingReferralCode));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return false;

            const referrerDoc = querySnapshot.docs[0];
            const referrerData = referrerDoc.data();
            const referrerId = referrerDoc.id;

            if (referrerId === String(newUserId)) return false;

            const batch = writeBatch(db);

            // Update referrer
            batch.update(doc(db, 'users', referrerId), {
                referralsCount: increment(1),
                totalReferralRewards: increment(XP_CONFIG.REFERRAL_BONUS.REFERRER),
                'stats.currentXP': increment(XP_CONFIG.REFERRAL_BONUS.REFERRER),
                'stats.totalXP': increment(XP_CONFIG.REFERRAL_BONUS.REFERRER),
                lastUpdated: serverTimestamp()
            });

            // Add to friends collection
            batch.set(doc(db, 'users', referrerId, 'friends', String(newUserId)), {
                userId: String(newUserId),
                username: userData.username || '',
                firstName: userData.firstName || '',
                referredAt: serverTimestamp()
            });

            // Update referred user
            batch.update(newUserRef, {
                referredBy: {
                    userId: referrerId,
                    username: referrerData.username || '',
                    firstName: referrerData.firstName || '',
                    referralCode: userData.pendingReferralCode
                },
                'stats.currentXP': increment(XP_CONFIG.REFERRAL_BONUS.REFERRED),
                'stats.totalXP': increment(XP_CONFIG.REFERRAL_BONUS.REFERRED),
                pendingReferralCode: deleteField(),
                lastUpdated: serverTimestamp()
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error processing referral:', error);
            return false;
        }
    },

    async initializeReferralCode(userId) {
        if (!userId) return null;
        try {
            const userRef = doc(db, 'users', String(userId));
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) return null;

            const userData = userDoc.data();
            if (!userData.referralCode) {
                const referralCode = generateReferralCode(userId);
                await updateDoc(userRef, {
                    referralCode,
                    referralsCount: 0,
                    totalReferralRewards: 0
                });
                return referralCode;
            }
            return userData.referralCode;
        } catch (error) {
            console.error('Error initializing referral code:', error);
            return null;
        }
    },

    async getReferralStats(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', String(userId)));
            if (!userDoc.exists()) return null;

            const userData = userDoc.data();
            return {
                referralCode: userData.referralCode || '',
                referralsCount: userData.referralsCount || 0,
                totalRewards: userData.totalReferralRewards || 0
            };
        } catch (error) {
            console.error('Error getting referral stats:', error);
            return null;
        }
    },

    async getFriendsList(userId) {
        try {
            const friendsSnapshot = await getDocs(
                collection(db, 'users', String(userId), 'friends')
            );
            return friendsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting friends list:', error);
            return [];
        }
    }
};