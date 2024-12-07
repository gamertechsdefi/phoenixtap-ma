import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase/clientApp';
import { signInWithCustomToken } from 'firebase/auth';

export default function TelegramAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const initDataString = new URLSearchParams(window.location.hash.slice(1)).get('tgWebAppData');
    
    if (initDataString) {
      setLoading(true);
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData: initDataString }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          return signInWithCustomToken(auth, data.token);
        }
        throw new Error('No token received');
      })
      .then((userCredential) => {
        setUser(userCredential.user);
        router.push('/dashboard'); // Redirect to dashboard after successful login
      })
      .catch(error => {
        console.error('Authentication error:', error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Authenticating...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Please log in via Telegram</div>;
  }

  return <div>Redirecting...</div>;
}
