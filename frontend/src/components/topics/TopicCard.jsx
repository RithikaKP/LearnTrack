import {
    CheckCircle, Circle, PlayCircle, FileText, Code, Link as LinkIcon,
    Edit2, Trash2, ChevronDown
} from 'lucide-react';

const DIFFICULTIES = {
    easy: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'Easy' },
    medium: { color: 'bg-amber-50 text-amber-700 border border-amber-100', label: 'Medium' },
    hard: { color: 'bg-red-50 text-red-700 border border-red-100', label: 'Hard' }
};

const STATUSES = {
    pending: { label: 'Pending', icon: Circle, color: 'text-zinc-400 border border-zinc-200 bg-zinc-50/50' },
    'in-progress': { label: 'In Progress', icon: PlayCircle, color: 'text-blue-600 bg-blue-50/60 border border-blue-100' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50/60 border border-emerald-100' },
    revision: { label: 'Revision', icon: FileText, color: 'text-indigo-600 bg-indigo-50/60 border border-indigo-100' }
};

const RESOURCE_ICONS = {
    youtube: PlayCircle,
    article: FileText,
    documentation: FileText,
    pdf: FileText,
    leetcode: Code,
    other: LinkIcon
};

const TopicCard = ({ topic, onStatusChange, onEdit, onDelete }) => {
    const status = STATUSES[topic.status] || STATUSES.pending;
    const difficulty = DIFFICULTIES[topic.difficulty] || DIFFICULTIES.medium;
    const StatusIcon = status.icon;

    return (
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm hover:shadow-md/5 transition-all group relative font-sans text-zinc-800">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-4 flex-1">
                    <div className="bg-zinc-100 border border-zinc-200 text-zinc-900 font-bold px-2.5 py-1 rounded-lg text-xs shrink-0 select-none">
                        Day {topic.dayNumber}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-zinc-800 text-sm leading-tight mb-1">
                            {topic.name}
                        </h3>
                        {topic.notes && (
                            <p className="text-xs text-zinc-400 line-clamp-2 mb-2 leading-relaxed">{topic.notes}</p>
                        )}

                        {topic.resources && topic.resources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {topic.resources.map((res, idx) => {
                                    const Icon = RESOURCE_ICONS[res.type] || LinkIcon;
                                    return (
                                        <a
                                            key={idx}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50/50 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Icon size={10} />
                                            <span>{res.title || res.type}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative ml-2 shrink-0">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                            onClick={() => onEdit(topic)}
                            className="p-1 hover:text-zinc-900 rounded text-zinc-400 transition-colors cursor-pointer"
                            title="Edit"
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this topic?')) onDelete(topic._id);
                            }}
                            className="p-1 hover:text-red-600 rounded text-zinc-400 transition-colors cursor-pointer"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-3">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${difficulty.color}`}>
                    {difficulty.label}
                </span>

                <div className="relative group/status">
                    <button className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold shadow-sm cursor-pointer transition-colors ${status.color}`}>
                        <StatusIcon size={12} />
                        <span>{status.label}</span>
                        <ChevronDown size={10} className="opacity-60" />
                    </button>

                    <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-xl border border-zinc-200/80 py-1 hidden group-hover/status:block z-25 animate-scale-in">
                        {Object.entries(STATUSES).map(([key, val]) => {
                            const ItemIcon = val.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => onStatusChange(topic._id, key)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                                        topic.status === key 
                                            ? 'text-zinc-950 font-bold bg-zinc-100' 
                                            : 'text-zinc-650 hover:bg-zinc-50'
                                    }`}
                                >
                                    <ItemIcon size={12} />
                                    <span>{val.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicCard;
