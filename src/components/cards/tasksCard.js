const TaskCard = ({ tasktype, taskreward, tasklink }) => {
    return (
        <button className="p-4 my-1 flex flex-row items-center justify-between rounded-lg bg-neutral-800 border-2  border-neutral-600 bg-opacity-50">

            <div className="flex flex-col items-start ">
                <p>{tasktype}</p>
                <p>
                    <span>{taskreward}</span>
                    <span> XP</span>
                    </p>
            </div>

            <p className="border-1 bg-orange-600 p-2 rounded-md">Start</p>
        </button>

    );
}

export default TaskCard;