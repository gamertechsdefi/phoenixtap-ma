'use client'

import React, { useState, useEffect } from 'react';
import { useXPManager } from '@/api/firebase/fireFunctions';
import TaskList from '@/components/TaskLink';
import WebApp from '@twa-dev/sdk';

export default function TaskPage() {
  const [userId, setUserId] = useState(null);
  const [twaInstance, setTwaInstance] = useState(null);
  const { totalXP, isLoading, updateXP } = useXPManager(userId);
  const [activeTab, setActiveTab] = useState('daily-login');

  // Initialize WebApp and get user ID
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
      const success = await updateXP(task.xpReward);
      if (success && typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.showPopup({
          title: 'Task Completed!',
          buttons: [{
            type: 'ok'
          }]
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const tabs = [
    { id: 'daily-login', label: 'Daily' },
    { id: 'stacks', label: 'Stacks' },
    { id: 'socials', label: 'Socials' }
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* XP Display */}
      <div className="bg-white rounded-lg p-4 shadow-md mb-6">
        <h2 className="text-orange-600 font-bold">
          Total XP: {totalXP || 0}
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-white rounded-lg p-2 shadow-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Lists */}
      {userId && (
        <div className="">
          <TaskList
            category={activeTab}
            onTaskComplete={handleTaskComplete}
          />
        </div>
      )}
    </div>
  );
}