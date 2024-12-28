'use client'

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import TaskCard from '@/components/cards/tasksCard';
import StackCard from '@/components/stacks/StackCard';
import StackInfo from '@/components/stacks/StackInfo';
import { useStackAvailability } from '@/components/stacks/StackHandler';

export default function TaskList({ category, onTaskComplete }) {
 const [tasks, setTasks] = useState([]);
 const [loading, setLoading] = useState(true);
 const { stackAvailable } = useStackAvailability();

 const fetchTasks = useCallback(async () => {
   try {
     setLoading(true);
     
     if (category === 'partners') {
       const q = query(
         collection(db, 'partners'),
         where('active', '==', true)
       );
       const querySnapshot = await getDocs(q);
       const partnerList = [];
       querySnapshot.forEach((doc) => {
         partnerList.push({ 
           id: doc.id, 
           ...doc.data(),
           category: 'partners',
           type: 'partner'
         });
       });
       
       partnerList.sort((a, b) => (a.position || 0) - (b.position || 0));
       setTasks(partnerList);
     } else {
       const q = query(
         collection(db, 'tasks'),
         where('category', '==', category)
       );
       const querySnapshot = await getDocs(q);
       const taskList = [];
       querySnapshot.forEach((doc) => {
         const data = doc.data();
         if (data.active !== false) {
           taskList.push({ 
             id: doc.id, 
             ...data,
             type: 'task'
           });
         }
       });
       
       taskList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
       setTasks(taskList);
     }
   } catch (error) {
     console.error('Error fetching tasks:', error.message);
     setTasks([]);
   } finally {
     setLoading(false);
   }
 }, [category]);

 useEffect(() => {
   fetchTasks();
 }, [fetchTasks]);

 if (loading) {
   return (
     <div className="text-center py-4 text-gray-400">
       Loading tasks...
     </div>
   );
 }

 return (
   <div className="space-y-2">
     {category === 'stacks' && (
       stackAvailable ? (
         <StackCard onTaskComplete={onTaskComplete} />
       ) : (
         <StackInfo />
       )
     )}
     
     {tasks.length === 0 ? (
       <div className="text-center py-4 text-gray-400">
         {category === 'partners' ? 'No partners available yet' : 'No tasks available'}
       </div>
     ) : (
       tasks.map(task => (
         <TaskCard
           key={task.id}
           task={task}
           onComplete={onTaskComplete}
         />
       ))
     )}
   </div>
 );
}