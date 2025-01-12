'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import WebApp from '@twa-dev/sdk';
import { useXPManager } from "@/api/firebase/functions/useXPManager";
import { taskService } from "@/api/firebase/functions/taskService";

// Dynamic imports
const TaskVerificationTimer = dynamic(() => import('@/components/TaskVerify'), {
  ssr: false
});

const TaskList = dynamic(() => import('@/components/TaskLink'), {
  ssr: false,
  loading: () => <TaskListSkeleton />
});

const StackComponent = dynamic(() => import('@/components/StackFunction'), {
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

// Loading skeleton component
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

// Tab configuration
const tabs = [
  { id: 'daily-login', label: 'Daily', icon: '📅' },
  { id: 'stacks', label: 'Stacks', icon: '🎯' },
  { id: 'socials', label: 'Socials', icon: '🌐' },
  { id: 'partners', label: 'Partners', icon: '🤝' }
];

export default function TaskPage() {
  // State management
  const [userId, setUserId] = useState(null);
  const [twaInstance, setTwaInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('daily-login');
  const [verifyingTask, setVerifyingTask] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [taskHistory, setTaskHistory] = useState({});
  
  // Custom hooks
  const { totalXP, isLoading, updateXP } = useXPManager(userId);

  // Fetch task history on user ID change
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      const history = await taskService.getTaskHistory(userId);
      setTaskHistory(history);
    };

    fetchHistory();
  }, [userId]);

  // Initialize WebApp and user ID
  useEffect(() => {
    try {
      const webApp = WebApp;
      setTwaInstance(webApp);
      if (webApp.initDataUnsafe?.user?.id) {
        setUserId(webApp.initDataUnsafe.user.id.toString());
      }
    } catch (error) {
      console.error('Error initializing WebApp:', error);
    }
  }, []);

  // Popup handler
  const showPopup = async (options) => {
    if (isPopupOpen || !twaInstance) return;
    
    try {
      setIsPopupOpen(true);
      await twaInstance.showPopup(options);
    } catch (error) {
      console.error('Error showing popup:', error);
    } finally {
      setIsPopupOpen(false);
    }
  };

  // Task click handler
  const handleTaskClick = async (task) => {
    try {
      // Handle external links for partner and social tasks
      if ((task.type === 'partner' || task.category === 'socials') && task.url) {
        twaInstance?.openLink(task.url);
      }
      setVerifyingTask(task);
    } catch (error) {
      console.error('Error handling task:', error);
      await showPopup({
        title: 'Error',
        message: 'Failed to start task',
        buttons: [{ type: 'ok' }]
      });
    }
  };

  // Verification completion handler
  const handleVerificationComplete = async () => {
    if (!verifyingTask || !userId) return;

    try {
      // Handle task completion based on type
      const result = verifyingTask.type === 'partner'
        ? await taskService.completePartnerTask(userId, verifyingTask.id)
        : await taskService.completeTask(userId, verifyingTask.id, verifyingTask.category);

      if (result.success) {
        // Update task history and show success popup
        const updatedHistory = await taskService.getTaskHistory(userId);
        setTaskHistory(updatedHistory);

        await showPopup({
          title: 'Task Completed!',
          message: `You earned ${result.xpEarned} XP!`,
          buttons: [{ type: 'ok' }]
        });

        await updateXP(result.xpEarned);
      } else {
        await showPopup({
          title: 'Error',
          message: result.error || 'Failed to complete task',
          buttons: [{ type: 'ok' }]
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
      await showPopup({
        title: 'Error',
        message: 'Failed to complete task',
        buttons: [{ type: 'ok' }]
      });
    } finally {
      setVerifyingTask(null);
    }
  };

  // Verification cancellation handler
  const handleVerificationCancel = async () => {
    setVerifyingTask(null);
    await showPopup({
      title: 'Cancelled',
      message: 'Task verification cancelled',
      buttons: [{ type: 'ok' }]
    });
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
            {/* XP Display */}
            <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 shadow-md mb-6">
              <h2 className="text-orange-400 font-bold flex items-center gap-2">
                <span>Total XP:</span>
                <span className="text-xl">
                  {isLoading ? '...' : totalXP?.toLocaleString() || 0}
                </span>
              </h2>
            </div>

            {/* Tab Navigation */}
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

            {/* Content Area */}
            {userId && (
              <Suspense fallback={<TaskListSkeleton />}>
                {activeTab === 'stacks' ? (
                  <StackComponent 
                    userId={userId}
                    onTaskComplete={handleTaskClick}
                  />
                ) : (
                  <TaskList
                    category={activeTab}
                    onTaskComplete={handleTaskClick}
                    userId={userId}
                    taskHistory={taskHistory}
                  />
                )}
              </Suspense>
            )}
          </main>

          {/* Verification Modal */}
          {verifyingTask && (
            <TaskVerificationTimer
              taskTitle={verifyingTask.title}
              onComplete={handleVerificationComplete}
              onCancel={handleVerificationCancel}
              seconds={10}
            />
          )}

          <Footer />
        </div>

        {/* Global Styles */}
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