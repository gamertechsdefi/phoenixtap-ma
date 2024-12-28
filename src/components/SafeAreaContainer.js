'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

const SafeAreaContainer = ({ children }) => {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
  });

  useEffect(() => {
    if (WebApp) {
      // Get safe area insets from Telegram WebApp
      const { safeAreaInset, contentSafeAreaInset } = WebApp.viewportStableHeight;
      setSafeAreaInsets({
        top: contentSafeAreaInset?.top || 0,
        bottom: safeAreaInset?.bottom || 0,
      });
    }
  }, []);

  return (
    <div 
      style={{
        paddingTop: `${safeAreaInsets.top}px`,
        paddingBottom: `${safeAreaInsets.bottom}px`,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="" // Or your desired background color
    >
      {children}
    </div>
  );
};

export default SafeAreaContainer;