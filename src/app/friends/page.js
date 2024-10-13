import { React } from "react";

import Link from "next/link";


const Friends = () => {

    const friendsList = [
        {
            id: 1,
            name: "FOSA",
            rewardAmount: 100000,

        },
        {
            id: 2,
            name: "FOSA",
            rewardAmount: 100000,

        },
        {
            id: 3,
            name: "FOSA",
            rewardAmount: 100000,

        },
        {
            name: "FOSA",
            rewardAmount: 100000,

        },
    ]
    return (
        <div className="min-h-screen flex flex-col">

        <main className="flex-grow">
            <div>

            </div>

            <div className="p-4">
                <h1 className="text-3xl font-bold pb-8 pt-8">Friends Lists</h1>
                {friendsList.map((item, index) =>
                    <FriendsCard
                    key={item.id}
                    name={item.name}
                    rewardAmount={item.rewardAmount}
                    />)}
            </div>
        </main>

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

const FriendsCard = ({ name, rewardAmount }) => {
    return (
        <p className="flex flex-col pb-4">
            <span className="text-2xl ">{name}</span>
            <span>{rewardAmount}</span>
        </p>
    );
}

export default Friends;