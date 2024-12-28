'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Game = dynamic(() => import('@/components/Game'), {
 loading: () => <div>Loading game...</div>,
 ssr: false
});

export default function Page() {
 return (
   <Suspense fallback={<div>Loading...</div>}>
     <Game />
   </Suspense>
 );
}