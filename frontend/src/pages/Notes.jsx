import { useState, useEffect, useContext } from 'react';
import {
    Plus, Search, PenTool, Pin, Tag, Book, Filter, X,
    Trash2, Edit2, Bookmark
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import noteService from '../context/noteService';

const Notes = () => {
    const { user } = useContext(AuthContext);

    // State
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pinned, revision
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
        isRevision: false,
        isPinned: false
    });

    // Fetch Notes
    const fetchNotes = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const params = { search };
            if (filter === 'pinned') params.isPinned = true;
            if (filter === 'revision') params.isRevision = true;

            const data = await noteService.getNotes(params, user.token);
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchNotes();
        }, 300); // Debounce search
        return () => clearTimeout(delayDebounce);
    }, [user, filter, search]);

    // Handlers
    const handlePin = async (e, id) => {
        e.stopPropagation();
        try {
            await noteService.togglePin(id, user.token);
            // Optimistic update
            setNotes(prev => prev.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n));
            // Re-sort handled by backend usually, but for local update we might want to refresh fully
            // For now, let's refresh fully to keep sort order correct
            fetchNotes();
        } catch (error) {
            console.error("Pin failed");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Delete this note?')) {
            try {
                await noteService.deleteNote(id, user.token);
                setNotes(prev => prev.filter(n => n._id !== id));
            } catch (error) {
                console.error("Delete failed");
            }
        }
    };

    const openModal = (note = null) => {
        if (note) {
            setEditingNote(note);
            setFormData({
                title: note.title,
                content: note.content,
                tags: note.tags.join(', '),
                isRevision: note.isRevision,
                isPinned: note.isPinned
            });
        } else {
            setEditingNote(null);
            setFormData({
                title: '', content: '', tags: '', isRevision: false, isPinned: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            if (editingNote) {
                await noteService.updateNote(editingNote._id, payload, user.token);
            } else {
                await noteService.createNote(payload, user.token);
            }
            setIsModalOpen(false);
            fetchNotes();
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    // Helper for time ago
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    return (
        <div className="w-full px-4 py-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Book className="text-indigo-600" /> Study Notes
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Capture ideas, revision points, and key concepts.</p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all w-full md:w-auto justify-center"
                >
                    <Plus size={20} /> New Note
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search notes by title or content..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                    {['all', 'pinned', 'revision'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500"></div>
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <PenTool size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No notes found</h3>
                    <p className="text-gray-500 mt-1">Create your first note to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <div
                            key={note._id}
                            onClick={() => openModal(note)}
                            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 group relative cursor-pointer flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-gray-800 text-lg line-clamp-1 pr-6">{note.title}</h3>
                                <button
                                    onClick={(e) => handlePin(e, note._id)}
                                    className={`absolute top-6 right-6 p-1 rounded-full hover:bg-gray-100 transition-colors ${note.isPinned ? 'text-indigo-600' : 'text-gray-300'}`}
                                >
                                    <Pin size={18} fill={note.isPinned ? "currentColor" : "none"} />
                                </button>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1 whitespace-pre-line">
                                {note.content}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {note.isRevision && (
                                    <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-md flex items-center gap-1">
                                        <Bookmark size={10} fill="currentColor" /> Revision
                                    </span>
                                )}
                                {note.tags.map((tag, i) => (
                                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-400">
                                <span>Updated {timeAgo(note.updatedAt)}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openModal(note); }}
                                        className="hover:text-indigo-600 p-1"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, note._id)}
                                        className="hover:text-red-600 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{editingNote ? 'Edit Note' : 'Create New Note'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-2xl font-bold placeholder-gray-300 border-none outline-none focus:ring-0 px-0"
                                    placeholder="Note Title"
                                />
                            </div>

                            <div className="flex-1 min-h-[300px]">
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full h-full min-h-[300px] resize-none border-none outline-none focus:ring-0 text-gray-700 leading-relaxed px-0"
                                    placeholder="Start typing your note here..."
                                ></textarea>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Tag size={18} />
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        className="flex-1 bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none py-1 text-sm"
                                        placeholder="Add tags (comma separated)..."
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isRevision ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white group-hover:border-purple-400'}`}>
                                            {formData.isRevision && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.isRevision}
                                            onChange={e => setFormData({ ...formData, isRevision: e.target.checked })}
                                            className="hidden"
                                        />
                                        <span className="text-sm text-gray-700">Mark for Revision</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isPinned ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white group-hover:border-indigo-400'}`}>
                                            {formData.isPinned && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.isPinned}
                                            onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                                            className="hidden"
                                        />
                                        <span className="text-sm text-gray-700">Pin Note</span>
                                    </label>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// CheckCircle Helper
const CheckCircle = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default Notes;
