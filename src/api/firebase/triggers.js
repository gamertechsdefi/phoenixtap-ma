// Initialize Firebase and Firestore
import { initializeApp, getApps } from 'firebase/app';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc, 
    increment,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    deleteField,
    setDoc
} from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };

const generateReferralCode = (userId) => {
    const prefix = 'PHX';
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${randomPart}`;
};

/**
 * Initialize or update user data when launching Telegram Mini App
 * @param {Object} telegramUser - User data from Telegram WebApp.initDataUnsafe.user
 * @returns {Promise<void>}
 */
// firebase/triggers.js


export const initializeUser = async (telegramUser) => {
    try {
        const userId = telegramUser.id.toString();
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            // Create new user
            await setDoc(userRef, {
                telegramId: userId,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name || '',
                username: telegramUser.username || '',
                languageCode: telegramUser.language_code || 'en',
                referralCode: generateReferralCode(userId),
                referralsCount: 0,
                totalReferralRewards: 0,
                stats: {
                    currentXP: 0,
                    totalXP: 0,
                    points: 0,
                    currentLevel: 1,
                    totalTaps: 0,
                    currentTaps: 2500,
                    pendingTotalTaps: 0,
                    adsWatched: 0,
                    tasksCompleted: 0,
                    friendsReferred: 0
                },
                energy: {
                    current: 2500,
                    max: 2500,
                    lastRegenTime: serverTimestamp()
                },
                settings: {
                    notifications: true,
                    soundEffects: true,
                    vibration: true
                },
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });
        }

        // Get user data (whether new or existing)
        const userData = (await getDoc(userRef)).data();
        
        // Process referral only if there's a pending code and user hasn't been referred yet
        if (userData.pendingReferralCode && !userData.referredBy) {
            try {
                // Find referrer
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('referralCode', '==', userData.pendingReferralCode));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const referrerDoc = querySnapshot.docs[0];
                    const referrerData = referrerDoc.data();
                    const referrerId = referrerDoc.id;

                    if (referrerId !== userId) {
                        const batch = writeBatch(db);

                        // Update referrer
                        const referrerRef = doc(db, 'users', referrerId);
                        batch.update(referrerRef, {
                            referralsCount: increment(0.5),
                            totalReferralRewards: increment(50),
                            'stats.totalXP': increment(50),
                            lastUpdated: serverTimestamp()
                        });

                        // Add to friends collection
                        const friendRef = doc(db, 'users', referrerId, 'friends', userId);
                        batch.set(friendRef, {
                            userId: userId,
                            username: userData.username || '',
                            firstName: userData.firstName || '',
                            referredAt: serverTimestamp()
                        });

                        // Update referred user
                        batch.update(userRef, {
                            referredBy: {
                                userId: referrerId,
                                username: referrerData.username || '',
                                firstName: referrerData.firstName || '',
                                referralCode: userData.pendingReferralCode
                            },
                            'stats.totalXP': increment(25),
                            pendingReferralCode: deleteField(),
                            lastUpdated: serverTimestamp()
                        });

                        await batch.commit();
                    }
                }
            } catch (error) {
                console.error('Error processing referral:', error);
            }
        } else {
            // Just update basic info if no referral to process
            await updateDoc(userRef, {
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name || '',
                username: telegramUser.username || '',
                lastActive: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error in initializeUser:', error);
        throw error;
    }
};

/**
 * Initialize user sub-collections
 * @param {string} userId 
 */
const initializeUserSubCollections = async (userId) => {
    // Initialize achievements sub-collection
    const achievementsRef = doc(db, 'users', userId, 'achievements', 'initial');
    await setDoc(achievementsRef, {
        achievements: {
            firstTap: {
                id: 'firstTap',
                name: 'First Tap',
                description: 'Tap your first coin',
                progress: 0,
                target: 1,
                completed: false,
                reward: {
                    type: 'points',
                    amount: 100
                }
            },
            tapMaster: {
                id: 'tapMaster',
                name: 'Tap Master',
                description: 'Reach 1000 taps',
                progress: 0,
                target: 1000,
                completed: false,
                reward: {
                    type: 'powerup',
                    item: 'autoClicker',
                    amount: 1
                }
            },
            // Add more achievements as needed
        }
    });
};

/**
 * Generate unique referral code for user
 * @param {string} userId 
 * @returns {string}
 */


/**
 * Get user data
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const getUserData = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        return userDoc.data();
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
};

/**
 * Update user stats
 * @param {string} userId 
 * @param {Object} stats 
 * @returns {Promise<void>}
 */
export const updateUserStats = async (userId, stats) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            stats: stats,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating user stats:', error);
        throw error;
    }
};