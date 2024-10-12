"use client";


import WebApp from "@twa-dev/sdk";
import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";

import Image from "next/image";

import clickerIcon from "../app/images/clicker.png";
import Footer from "@/components/footer";

export default function Home() {


      
    const initData = WebApp.initData;

// if (initData) {
    // The user is launching your website from Telegram
    return (
        <div className="min-h-screen flex flex-col">
            <Main />
            <Footer />
        </div>
    );
//     );
// } else {
//     // The user is not launching your website from Telegram
//     console.log('Not launched from Telegram');
// }
}

function Main() {

    const [increment, setIncrement] = useState(0);
    const [decrement, setDecrement] = useState(2500);

    const handleClick = async () => {
        setIncrement(prevIncrement => prevIncrement + 1); // Update state to increase by 1

        setDecrement(prevDecrement => {
            if (prevDecrement > 0) {
                const newDecrement = prevDecrement - 1;

                // Start interval to increase decrement by 0.5 every second when it hits 0
                if (newDecrement < 1) {
                    const intervalId = setInterval(() => {
                        setDecrement(prevDecrement => {
                            // Stop the increment when prevDecrement reaches 2500
                            if (prevDecrement >= 25000) {
                                clearInterval(intervalId);
                                return prevDecrement; // Stop incrementing
                            }
                            return prevDecrement + 0.5; // Continue incrementing until 2500
                        });
                    }, 1000); // Increase by 0.5 every 2 seconds

                    return newDecrement;
                }

                return newDecrement;
            } else {
                return 0; // Ensure decrement does not go below zero
            }
        });
    };


    return (
        <main className="flex-grow flex-col mx-4 mt-8">

            <div className="flex gap-3 items-center mb-8">
                <div className="w-[30px] h-[30px] bg-gray-200 rounded-md"></div>
                <p>User</p>
            </div>

            <div className="flex flex-col items-center justify-center">
                <p className="text-6xl text-center pb-8">{increment}</p>


                <button
                    className=" w-[90%]" onClick={handleClick} disabled={decrement <= 0}>
                    <Image
                        src={clickerIcon} alt="clicker icon" />
                </button>

            </div>

            <div>
                <div className="mt-4 flex justify-center">
                    <div className="w-[50%] border-2 border-orange-600 p-4 text-2xl rounded-lg flex items-center justify-center">
                        <span>{decrement}</span>
                        <span> /2500</span>
                    </div>
                </div>

            </div>
        </main>
    );
}