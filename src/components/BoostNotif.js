'use client';

import React, { useEffect } from 'react';

const BoostNotification = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isError = message.includes('Error') || message.includes('Need');

  return (
    <div className="fixed mx-4 top-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div 
        className={`
          px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
          ${isError 
            ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
            : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'
          }
          flex items-center justify-between
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isError ? '❌' : '✨'}
          </span>
          <p className="font-medium">{message}</p>
        </div>
        
        <button 
          onClick={onClose}
          className={`
            p-1 rounded-full hover:bg-black/10 transition-colors
            ${isError ? 'text-red-500' : 'text-emerald-500'}
          `}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default BoostNotification;