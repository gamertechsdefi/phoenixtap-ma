// lib/firebase/user.js
import { db } from '@/utils/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export async function saveUser(userData) {
  const userRef = doc(db, 'users', userData.id.toString());
  await setDoc(userRef, {
    username: userData.username,
    firstName: userData.first_name,
    lastActive: new Date().toISOString(),
    score: 0,
  }, { merge: true });
}

export async function updateUserScore(userId, score) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    score,
    lastActive: new Date().toISOString(),
  });
}

export async function getUserProfile(userId) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data() : null;
}