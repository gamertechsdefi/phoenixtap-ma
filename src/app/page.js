"use client";

import React, { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import clickerIcon from "../app/images/clicker.png";

export default function Home() {
  const [increment, setIncrement] = useState(0);
  const [decrement, setDecrement] = useState(2500);
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    // Check if the app is running in Telegram Web App environment
    const initDataUnsafe = WebApp.initDataUnsafe || {};
    setIsWebApp(!!initDataUnsafe.user);
  }, []);

  const handleClick = () => {
    setIncrement((prev) => prev + 1);
    setDecrement((prev) => {
      if (prev <= 0) return 0;
      const newValue = prev - 1;
      if (newValue < 1) {
        const intervalId = setInterval(() => {
          setDecrement((prev) => {
            if (prev >= 2500) {
              clearInterval(intervalId);
              return 2500;
            }
            return prev + 0.5;
          });
        }, 1000);
      }
      return newValue;
    });
  };

  if (!isWebApp) {
    return <div>This app is designed to run in Telegram Web App.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex-col mx-4 mt-8">
        <div className="flex gap-3 items-center mb-8">
          <div className="w-[30px] h-[30px] bg-gray-200 rounded-md"></div>
          <p>User</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-6xl text-center pb-8">{increment}</p>
          <button
            className="w-[90%]"
            onClick={handleClick}
            disabled={decrement <= 0}
          >
            <Image src={clickerIcon} alt="clicker icon" />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="w-[50%] border-2 border-orange-600 p-4 text-2xl rounded-lg flex items-center justify-center">
            <span>{decrement.toFixed(1)}</span>
            <span> /2500</span>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 w-full bg-white border-t">
        <nav className="flex justify-between p-4">
          <Link href="/" className="text-blue-600">Home</Link>
          <Link href="/tasks" className="text-blue-600">Tasks</Link>
          <Link href="/friend" className="text-blue-600">Friend</Link>
          <Link href="/claim" className="text-blue-600">Claim</Link>
        </nav>
      </footer>
    </div>
  );
}