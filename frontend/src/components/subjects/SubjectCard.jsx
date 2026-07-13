import { Trash2, BookOpen, Edit2, Play, Pause, Archive, FolderOpen, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SubjectCard = ({ subject, onDelete, onEdit, onStatusChange }) => {
    const {
        _id,
        name,
        description,
        progressPercentage,
        completedTopics,
        totalTopics,
        dailyTarget,
        color,
        icon,
        status = 'active',
        currentTopicName
    } = subject;

    const remainingCount = Math.max(0, totalTopics - completedTopics);
    const pace = dailyTarget || 2;
    const daysNeeded = Math.ceil(remainingCount / pace);

    const getEstimatedCompletionDate = () => {
        if (remainingCount === 0 || progressPercentage === 100) return 'All Completed! 🎉';
        const date = new Date();
        date.setDate(date.getDate() + daysNeeded);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const calculatedStatus = (progressPercentage === 100 && totalTopics > 0) ? 'completed' : status;

    const STATUS_META = {
        active: { label: 'Active', classes: 'bg-sky-50 text-sky-700 border-sky-100' },
        paused: { label: 'Paused', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
        archived: { label: 'Archived', classes: 'bg-zinc-150 text-zinc-650 border-zinc-200' },
        completed: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    };

    const statusStyle = STATUS_META[calculatedStatus] || STATUS_META.active;

    return (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[280px]">
            <div
                className="absolute top-0 left-0 w-full h-[3px]"
                style={{ backgroundColor: color }}
            />

            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg select-none"
                            style={{ backgroundColor: `${color}1A`, border: `1px solid ${color}26` }}
                        >
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 text-sm leading-snug group-hover:text-zinc-950 transition-colors">
                                {name}
                            </h3>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border mt-1 ${statusStyle.classes}`}>
                                {statusStyle.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {calculatedStatus !== 'completed' && (
                            status === 'active' ? (
                                <button
                                    onClick={() => onStatusChange(_id, 'paused')}
                                    className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                    title="Pause Study"
                                >
                                    <Pause size={12} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => onStatusChange(_id, 'active')}
                                    className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors cursor-pointer"
                                    title="Resume Study"
                                >
                                    <Play size={12} />
                                </button>
                            )
                        )}

                        {status === 'archived' ? (
                            <button
                                onClick={() => onStatusChange(_id, 'active')}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                                title="Unarchive Subject"
                            >
                                <FolderOpen size={12} />
                            </button>
                        ) : (
                            <button
                                onClick={() => onStatusChange(_id, 'archived')}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-150 rounded transition-colors cursor-pointer"
                                title="Archive Subject"
                            >
                                <Archive size={12} />
                            </button>
                        )}

                        <button
                            onClick={() => onEdit(subject)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                            title="Edit"
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            onClick={() => onDelete(_id)}
                            className="p-1.5 text-zinc-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>

                {description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            <div className="space-y-4 my-2">
                <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 mb-1">
                        <span>PROGRESS</span>
                        <span>{progressPercentage}%</span>
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
                    <div className="flex justify-between items-center text-[10px] text-zinc-450 mt-1.5">
                        <span>{completedTopics} / {totalTopics} topics done</span>
                        {remainingCount > 0 && <span>{remainingCount} left</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-zinc-50/50 border border-zinc-100 rounded-lg p-2.5 text-xs text-zinc-600">
                    <div>
                        <p className="text-[9px] text-zinc-400 uppercase font-black tracking-wider select-none">Pace</p>
                        <p className="font-bold text-zinc-800 mt-0.5">{pace} / day</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-zinc-400 uppercase font-black tracking-wider select-none">Completion</p>
                        <p className="font-bold text-zinc-800 mt-0.5 flex items-center gap-1 select-none">
                            <Calendar size={10} className="text-zinc-400" />
                            <span className="truncate">{getEstimatedCompletionDate()}</span>
                        </p>
                    </div>
                </div>

                {status !== 'archived' && (
                    <div className="border-t border-zinc-100 pt-3">
                        <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider block mb-1 select-none">Current Scheduled Topic</span>
                        <div className="text-xs font-semibold text-zinc-850 truncate bg-zinc-50 border border-zinc-200/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                            <BookOpen size={11} className="text-zinc-400 shrink-0" />
                            <span className="truncate">{currentTopicName || 'No active topic'}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-zinc-100 pt-3 flex justify-end">
                <Link
                    to={`/subjects/${_id}`}
                    className="inline-flex items-center justify-center gap-1 bg-zinc-950 text-white hover:bg-zinc-900 px-3.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-all hover:translate-x-0.5"
                >
                    <span>Study Plan</span>
                    <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
};

export default SubjectCard;
