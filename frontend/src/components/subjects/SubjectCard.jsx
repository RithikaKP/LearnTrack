import { Trash2, BookOpen } from 'lucide-react';
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
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group relative overflow-hidden">

            {/* Top Color Bar */}
            <div
                className="absolute top-0 left-0 w-full h-1.5"
                style={{ backgroundColor: color }}
            />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        {icon}
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                            {name}
                        </h3>
                        {description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Edit & Delete Icons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                    {/* Edit */}
                    <button
                        onClick={() => onEdit(subject)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Subject"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Subject"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Progress Section */}
            <div className="mb-5">
                <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">{progressPercentage}%</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>

                <div className="mt-2 text-xs text-gray-500 font-medium">
                    {completedTopics} / {totalTopics} topics completed
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                        Days Left
                    </p>
                    <p className="font-bold text-gray-700">{daysLeft}</p>
                </div>

                <div className="w-px h-8 bg-gray-100"></div>

                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                        Daily Goal
                    </p>
                    <p className="font-bold text-gray-700">{dailyTarget}</p>
                </div>

                <div className="w-px h-8 bg-gray-100"></div>

                <Link
                    to={`/subjects/${_id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                    View
                    <BookOpen size={14} />
                </Link>
            </div>
        </div>
    );
};

export default SubjectCard;
