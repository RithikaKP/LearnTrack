import { useState } from 'react';
import {
    CheckCircle, Circle, PlayCircle, FileText, Code, Link as LinkIcon,
    MoreVertical, Edit2, Trash2, ChevronDown
} from 'lucide-react';

const DIFFICULTIES = {
    easy: { color: 'bg-green-100 text-green-700', label: 'Easy' },
    medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' },
    hard: { color: 'bg-red-100 text-red-700', label: 'Hard' }
};

const STATUSES = {
    pending: { label: 'Pending', icon: Circle, color: 'text-gray-400' },
    'in-progress': { label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-500' },
    revision: { label: 'Revision', icon: FileText, color: 'text-orange-500' }
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Derived state/defaults
    const status = STATUSES[topic.status] || STATUSES.pending;
    const difficulty = DIFFICULTIES[topic.difficulty] || DIFFICULTIES.medium;
    const StatusIcon = status.icon;

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-4 flex-1">
                    {/* Day Number Badge */}
                    <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-sm shrink-0">
                        Day {topic.dayNumber}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-1">
                            {topic.name}
                        </h3>
                        {topic.notes && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{topic.notes}</p>
                        )}

                        {/* Resource Chips */}
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
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Icon size={12} />
                                            {res.title || res.type}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Menu */}
                <div className="relative ml-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                            onClick={() => onEdit(topic)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Delete this topic?')) onDelete(topic._id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                {/* Difficulty Badge */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${difficulty.color}`}>
                    {difficulty.label}
                </span>

                {/* Status Dropdown */}
                <div className="relative group/status">
                    <button className={`flex items-center gap-1.5 text-sm font-medium ${status.color} hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors`}>
                        <StatusIcon size={16} />
                        <span>{status.label}</span>
                        <ChevronDown size={14} className="opacity-50" />
                    </button>

                    {/* Dropdown Content */}
                    <div className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden group-hover/status:block z-10 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {Object.entries(STATUSES).map(([key, val]) => {
                            const ItemIcon = val.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => onStatusChange(topic._id, key)}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${topic.status === key ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'
                                        }`}
                                >
                                    <ItemIcon size={14} />
                                    {val.label}
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
