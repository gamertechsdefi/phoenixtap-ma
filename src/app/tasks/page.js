import { React } from "react";
import Footer from "@/components/footer";

import TaskCard from "@/components/cards/tasksCard";

export default function Tasks() {

    const dailytasks = [
        {
            id: 1,
            tasktype: "Visit channel and engage",
            taskreward: 100,
        },
        {
            id: 2,
            tasktype: "Visit group and engage",
            taskreward: 25,
        },
    ];

    const tasklists = [
        {
            id: 1,
            tasktype: "Follow our X page",
            taskreward: 100,
        },
        {
            id: 2,
            tasktype: "Retweet post",
            taskreward: 25,
        },
        {
            id: 3,
            tasktype: "Retweet post",
            taskreward: 25,
        }
    ];

    const quicktasks = [
        {
            id: 1,
            tasktype: "Watch ad",
            taskreward: 250,
        },
        {
            id: 2,
            tasktype: "Share on your status",
            taskreward: 100,
        },
    ];


    return (


        <div className="min-h-screen flex flex-col">
            <main className="flex flex-col flex-grow mt-16">

                <div className="flex flex-col px-8 justify-center mb-8">
                    <h1 className="text-3xl font-bold text-orange-400 pb-4">Daily login</h1>
                    {dailytasks.map((item, index) =>
                        <TaskCard
                            key={item.id}
                            tasktype={item.tasktype}
                            taskreward={item.taskreward}
                        />
                    )}
                </div>

                <div className="flex flex-col px-8 justify-center mb-8">
                    <h1 className="pb-4">
                        <span className="text-3xl font-bold text-orange-400 ">Quick earnings </span>
                        <span className="text-neutral-300">(Coming Soon)</span>
                    </h1>
                    {quicktasks.map((item, index) =>
                    <TaskCard
                    key={item.id}
                    tasktype={item.tasktype}
                    taskreward={item.taskreward}
                     />
                    )}
                    </div>

                    <div>
                        <h2>Hello</h2>
                    </div>




                <div className="flex flex-col px-8 justify-center">
                    <h1 className="text-3xl font-bold text-orange-400 pb-4">Tasks to earn</h1>
                    {tasklists.map((item, index) =>
                        <TaskCard
                            key={item.id}
                            tasktype={item.tasktype}
                            taskreward={item.taskreward}
                        />
                    )}
                </div>


            </main>

           <Footer />
        </div>


    );
}

