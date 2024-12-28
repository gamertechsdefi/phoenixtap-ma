'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import WebApp from '@twa-dev/sdk';
import { useXPManager } from '@/api/firebase/fireFunctions';

const TaskList = dynamic(() => import('@/components/TaskLink'), {
  ssr: false,
  loading: () => <TaskListSkeleton />
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-16" />
});

const SafeAreaContainer = dynamic(() => import('@/components/SafeAreaContainer'), {
  ssr: false
});

const TaskListSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-neutral-800 p-4 rounded-lg">
        <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-neutral-700 rounded w-1/2" />
      </div>
    ))}
  </div>
);

const tabs = [
  { id: 'daily-login', label: 'Daily', icon: '📅' },
  { id: 'stacks', label: 'Stacks', icon: '🎯' },
  { id: 'socials', label: 'Socials', icon: '🌐' },
  { id: 'partners', label: 'Partners', icon: '🤝' }
];

export default function TaskPage() {
  const [userId, setUserId] = useState(null);
  const [twaInstance, setTwaInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('daily-login');
  
  // Use the custom hook for XP management
  const { totalXP, isLoading, updateXP } = useXPManager(userId);

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

  const handleTaskComplete = async (task) => {
    try {
      if (task.type === 'partner' && task.url && twaInstance) {
        twaInstance.openLink(task.url);
      }

      const success = await updateXP(task.xpReward);
      if (success && twaInstance) {
        twaInstance.showPopup({
          title: 'Task Completed!',
          message: `You earned ${task.xpReward} XP!`,
          buttons: [{ type: 'ok' }]
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
      twaInstance?.showPopup({
        title: 'Error',
        message: 'Failed to complete task. Please try again.',
        buttons: [{ type: 'ok' }]
      });
    }
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-pulse">Loading...</div>
      </div>
    }>
      <SafeAreaContainer>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow p-4">
            <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 shadow-md mb-6">
              <h2 className="text-orange-400 font-bold flex items-center gap-2">
                <span>Total XP:</span>
                <span className="text-xl">
                  {isLoading ? '...' : totalXP?.toLocaleString() || 0}
                </span>
              </h2>
            </div>

            <div className="bg-neutral-900 bg-opacity-50 rounded-lg shadow-md mb-6 p-2 overflow-hidden">
              <div className="flex overflow-x-auto scrollbar-hide gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg transition-colors flex-shrink-0 min-w-[100px] ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {userId && (
              <Suspense fallback={<TaskListSkeleton />}>
                <TaskList
                  category={activeTab}
                  onTaskComplete={handleTaskComplete}
                />
              </Suspense>
            )}
          </main>
          <Suspense fallback={<div className="h-16" />}>
            <Footer />
          </Suspense>
        </div>

        <style jsx global>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </SafeAreaContainer>
    </Suspense>
  );
}