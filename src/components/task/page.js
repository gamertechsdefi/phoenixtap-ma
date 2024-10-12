import { React } from "react";
import Footer from "../layouts/footer";

import TaskCard from "@/components/cards/tasksCard";

const Tasks = () => {

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
                    <div className="flex flex-col">
                        <button className="p-4 my-1 flex flex-row items-center justify-between rounded-lg bg-neutral-800 border-2  border-neutral-600 bg-opacity-50">

                            <p className="flex flex-col items-start ">
                                <span>Watch ad</span>
                                <span>500 XP</span>
                            </p>

                            <p className="border-1 bg-orange-600 p-2 rounded-md">Start</p>
                        </button>

                        <button className="p-4 my-1 flex flex-row items-center justify-between rounded-lg bg-neutral-800 border-2  border-neutral-600 bg-opacity-50">

                            <p className="flex flex-col items-start ">
                                <span>Enter daily code</span>
                                <span>250 XP</span>
                            </p>

                            <p className="border-1 bg-orange-600 p-2 rounded-md">Start</p>
                        </button>

                    </div>
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


export default Tasks;