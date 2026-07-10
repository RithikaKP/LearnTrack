import { Trash2, BookOpen, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SubjectCard = ({ subject, onDelete, onEdit }) => {
    const {
        _id,
        name,
        description,
        progressPercentage,
        completedTopics,
        totalTopics,
        daysLeft,
        dailyTarget,
        color,
        icon,
    } = subject;

    return (
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm hover:shadow-md/5 transition-all duration-300 relative overflow-hidden group font-sans text-zinc-800">
            {/* Top Color Bar */}
            <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: color }}
            />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner select-none"
                        style={{ backgroundColor: `${color}12` }}
                    >
                        {icon}
                    </div>

                    <div>
                        <h3 className="font-semibold text-zinc-900 text-sm leading-tight group-hover:text-zinc-950 transition-colors">
                            {name}
                        </h3>
                        {description && (
                            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Edit & Delete Icons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(subject)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                        title="Edit Subject"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={() => onDelete(_id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50/50 rounded transition-colors cursor-pointer"
                        title="Delete Subject"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Progress Section */}
            <div className="mb-4 pt-1">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-zinc-500">Subject Progress</span>
                    <span className="text-zinc-900 font-semibold">{progressPercentage}%</span>
                </div>

                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>

                <div className="mt-1.5 text-[10px] text-zinc-400 font-medium">
                    {completedTopics} / {totalTopics} topics completed
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-xs">
                <div className="text-center">
                    <p className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">
                        Days Left
                    </p>
                    <p className="font-bold text-zinc-800 mt-0.5">{daysLeft}</p>
                </div>

                <div className="w-px h-6 bg-zinc-200/50"></div>

                <div className="text-center">
                    <p className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">
                        Daily Goal
                    </p>
                    <p className="font-bold text-zinc-800 mt-0.5">{dailyTarget}</p>
                </div>

                <div className="w-px h-6 bg-zinc-200/50"></div>

                <Link
                    to={`/subjects/${_id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-900 hover:underline"
                >
                    <span>View track</span>
                    <BookOpen size={11} />
                </Link>
            </div>
        </div>
    );
};

export default SubjectCard;
