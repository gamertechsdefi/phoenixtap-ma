"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import WebApp from "@twa-dev/sdk";
import { useXPManager } from "@/api/firebase/functions/useXPManager";
import { taskService } from "@/api/firebase/functions/taskService";

// Dynamically import components
const TaskVerificationTimer = dynamic(() => import("@/components/TaskVerify"), {
  ssr: false,
});

const TaskList = dynamic(() => import("@/components/TaskLink"), {
  ssr: false,
  loading: () => <TaskListSkeleton />,
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
});

const SafeAreaContainer = dynamic(
  () => import("@/components/SafeAreaContainer"),
  {
    ssr: false,
  }
);

// Skeleton loader for task list
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
  { id: "daily", label: "Daily", icon: "📅" },
  { id: "social", label: "Social", icon: "🌐" },
  { id: "partner", label: "Partners", icon: "🤝" },
];

export default function TaskPage() {
  const [userId, setUserId] = useState(null);
  const [twaInstance, setTwaInstance] = useState(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [verifyingTask, setVerifyingTask] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const { totalXP, isLoading: xpLoading, updateXP } = useXPManager(userId);

  // Initialize WebApp and user ID
  useEffect(() => {
    try {
      const webApp = WebApp;
      setTwaInstance(webApp);
      if (webApp.initDataUnsafe?.user?.id) {
        setUserId(webApp.initDataUnsafe.user.id.toString());
      }
    } catch (error) {
      console.error("Error initializing WebApp:", error);
    }
  }, []);

  // Show popup utility function
  const showPopup = async (options) => {
    if (isPopupOpen || !twaInstance) return;

    try {
      setIsPopupOpen(true);
      await twaInstance.showPopup(options);
    } catch (error) {
      console.error("Error showing popup:", error);
    } finally {
      setIsPopupOpen(false);
    }
  };

  // Handle task initiation
  const handleTaskStart = async (task) => {
    try {
      if (task.url) {
        twaInstance?.openLink(task.url);
      }
      setVerifyingTask(task);
    } catch (error) {
      console.error("Error starting task:", error);
      await showPopup({
        title: "Error",
        message: "Failed to start task",
        buttons: [{ type: "ok" }],
      });
    }
  };

  // Handle verification completion
  const handleVerificationComplete = async () => {
    if (!verifyingTask || !userId) return;

    try {
      let result;

      result = await taskService.completeTask(
        userId,
        verifyingTask.id,
        verifyingTask.type
      );

      if (result.success) {
        await showPopup({
          title: "Task Completed!",
          message: `You earned ${result.xpEarned} XP!`,
          buttons: [{ type: "ok" }],
        });

        await updateXP(result.xpEarned);
      } else {
        await showPopup({
          title: "Error",
          message: result.error || "Failed to complete task",
          buttons: [{ type: "ok" }],
        });
      }
    } catch (error) {
      console.error("Error completing task:", error);
      await showPopup({
        title: "Error",
        message: "Failed to complete task",
        buttons: [{ type: "ok" }],
      });
    } finally {
      setVerifyingTask(null);
    }
  };

  // Handle verification cancellation
  const handleVerificationCancel = async () => {
    setVerifyingTask(null);
    await showPopup({
      title: "Cancelled",
      message: "Task verification cancelled",
      buttons: [{ type: "ok" }],
    });
  };

  return (
    <SafeAreaContainer>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow p-4">
          {/* XP Display */}
          <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4 shadow-md mb-6">
            <h2 className="text-orange-400 font-bold flex items-center gap-2">
              <span>Total XP:</span>
              <span className="text-xl">
                {xpLoading ? "..." : totalXP?.toLocaleString() || 0}
              </span>
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="bg-neutral-900 bg-opacity-50 rounded-lg shadow-md mb-6 p-2 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 
                    whitespace-nowrap px-4 py-2 rounded-lg transition-colors 
                    flex-shrink-0 min-w-[100px] ${
                      activeTab === tab.id
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-neutral-800"
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          {userId && (
            <Suspense fallback={<TaskListSkeleton />}>
              <TaskList
                category={activeTab}
                onTaskComplete={handleTaskStart}
                userId={userId}
              />
            </Suspense>
          )}

<div>
          <h1>Watch ads</h1>
          <div className="bg-neutral-900 bg-opacity-50 rounded-lg shadow-md p-4 transition-all duration-200 ">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Watch ad
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 rounded-md text-sm">250 XP</span>
                </div>
              </div>
              <button
                className="bg-neutral-100 hover:bg-neutral-200 
              px-4 py-2 rounded-lg text-neutral-900 
              transition-colors duration-200"
              >
                Watch
              </button>
            </div>
          </div>
        </div>
        </main>

        {/* Verification Timer */}
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
  );
}
