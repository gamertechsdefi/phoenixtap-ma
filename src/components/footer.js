'use client'

import Link from "next/link";

import {React} from "react";

export default function Footer() {


    return (
      <footer className="sticky bottom-0 w-full bg-orange-600 text-white p-4 pb-4">
        <nav class="">
          <div class="flex justify-between">
            <Link href="/">Home</Link>
            <Link href="/tasks" >Tasks</Link>
            <Link href="/friends" >Friends</Link>
            <Link href="/claim">Claim</Link>
          </div>
        </nav>
      </footer>
    );
  }