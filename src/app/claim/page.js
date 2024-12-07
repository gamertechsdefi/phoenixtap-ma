import React from "react";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function Claim(){
    return (
        <div className="min-h-screen flex flex-col">
           <main className="flex-grow">
            <h1>Hello Claim page</h1>
           </main>
           <Footer />
        </div>
    );
}