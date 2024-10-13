import React from "react";

import Link from "next/link";

export default function Claim(){
    return (
        <div className="min-h-screen flex flex-col">
           <div className="flex-grow">
            <h1>Hello Claim page</h1>
           </div>

           <footer className="flex sticky bottom-0">
                <div className="flex flex-row justify-between">
                    <Link href="/">Home</Link>
                    <Link href="/tasks">Home</Link>
                    <Link href="/friend">Home</Link>
                    <Link href="/claim">Home</Link>
                </div>
            </footer>
        </div>
    );
}