import { useState, useEffect, useContext, useCallback } from 'react';
import {
    Plus, Search, PenTool, Pin, Tag, Book, Filter, X,
    Trash2, Edit2, Bookmark, Sparkles, CheckCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import noteService from '../context/noteService';

const Notes = () => {
    const { user } = useContext(AuthContext);

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
        isRevision: false,
        isPinned: false
    });

    const fetchNotes = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const params = { search };
            if (filter === 'pinned') params.isPinned = true;
            if (filter === 'revision') params.isRevision = true;

            const data = await noteService.getNotes(params);
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            setLoading(false);
        }
    }, [user, filter, search]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchNotes();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [fetchNotes]);

    const handlePin = async (e, id) => {
        e.stopPropagation();
        try {
            await noteService.togglePin(id);
            setNotes(prev => prev.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n));
            fetchNotes();
        } catch (error) {
            console.error("Pin failed", error);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await noteService.deleteNote(id);
                setNotes(prev => prev.filter(n => n._id !== id));
            } catch (error) {
                console.error("Delete failed", error);
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
                await noteService.updateNote(editingNote._id, payload);
            } else {
                await noteService.createNote(payload);
            }
            setIsModalOpen(false);
            fetchNotes();
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

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
        <div className="w-full px-4 sm:px-6 py-8 font-sans text-zinc-800 bg-white min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 border border-zinc-200/50">
                        <Book size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Study Notes</h1>
                        <p className="text-sm text-zinc-500">Capture ideas, revision checklists, and core learning logs.</p>
                    </div>
                </div>

                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center gap-2 bg-zinc-950 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-900 shadow-sm hover:translate-y-[-0.5px] active:translate-y-0 transition-all cursor-pointer"
                >
                    <Plus size={16} /> New Note
                </button>
            </div>

            <div className="bg-white border border-zinc-200/60 p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search notes by title or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-all outline-none focus:border-zinc-800 shadow-sm"
                    />
                </div>

                <div className="flex bg-zinc-100 p-1 border border-zinc-200/20 rounded-lg w-full md:w-auto">
                    {['all', 'pinned', 'revision'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                                filter === f 
                                    ? 'bg-zinc-950 text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-950 border-t-transparent"></div>
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200 select-none">
                    <PenTool size={36} className="mx-auto text-zinc-300 mb-3 animate-pulse" />
                    <h3 className="text-sm font-semibold text-zinc-850">No notes found</h3>
                    <p className="text-xs text-zinc-450 mt-1">Create your first study scribble or note checklist to begin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <div
                            key={note._id}
                            onClick={() => openModal(note)}
                            className="bg-white rounded-xl p-5 border border-zinc-200/60 shadow-sm hover:shadow-md/5 transition-all group relative cursor-pointer flex flex-col justify-between h-56"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2.5">
                                    <h3 className="font-semibold text-sm text-zinc-800 truncate pr-6 leading-tight">{note.title}</h3>
                                    <button
                                        onClick={(e) => handlePin(e, note._id)}
                                        className={`absolute top-5 right-5 p-1 rounded-md hover:bg-zinc-100 transition-colors ${
                                            note.isPinned ? 'text-zinc-950' : 'text-zinc-300'
                                        }`}
                                    >
                                        <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
                                    </button>
                                </div>

                                <p className="text-zinc-500 text-xs mb-4 line-clamp-4 leading-relaxed whitespace-pre-line">
                                    {note.content}
                                </p>
                            </div>

                            <div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {note.isRevision && (
                                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                                            <Sparkles size={9} /> Revision
                                        </span>
                                    )}
                                    {note.tags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[10px] font-medium bg-zinc-100 text-zinc-650 border border-zinc-200/20 px-1.5 py-0.5 rounded">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-zinc-150/40 text-[10px] font-medium text-zinc-400">
                                    <span>Updated {timeAgo(note.updatedAt)}</span>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openModal(note); }}
                                            className="hover:text-zinc-950 p-1"
                                            title="Edit Note"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, note._id)}
                                            className="hover:text-red-650 p-1"
                                            title="Delete Note"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border border-zinc-250/50 shadow-2xl w-full max-w-2xl h-[75vh] flex flex-col rounded-xl overflow-hidden animate-scale-in">
                        
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                            <h2 className="text-sm font-semibold text-zinc-900">{editingNote ? 'Edit Study Note' : 'Create New Note'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-150/50 rounded-lg transition-colors cursor-pointer">
                                <X size={16} className="text-zinc-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Note Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-lg font-bold placeholder-zinc-300 border-b border-zinc-200 outline-none focus:border-zinc-800 pb-1"
                                    placeholder="e.g. Graph BFS Traversal"
                                />
                            </div>

                            <div className="flex-1 min-h-[220px]">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 select-none">Note Content</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full h-full min-h-[220px] resize-none border border-zinc-200 rounded-lg p-3 text-xs text-zinc-700 leading-relaxed outline-none focus:border-zinc-800 bg-zinc-50/20"
                                    placeholder="Write your explanation or code snippets here..."
                                ></textarea>
                            </div>

                            <div className="pt-2 border-t border-zinc-100 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-zinc-400" />
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        className="flex-1 bg-transparent border-b border-zinc-200 focus:border-zinc-800 outline-none py-1 text-xs"
                                        placeholder="Add tags separated by comma (e.g. graphs, bfs, algorithms)..."
                                    />
                                </div>

                                <div className="flex items-center gap-5 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                                        <input
                                            type="checkbox"
                                            checked={formData.isRevision}
                                            onChange={e => setFormData({ ...formData, isRevision: e.target.checked })}
                                            className="w-3.5 h-3.5 border border-zinc-300 rounded focus:ring-0 text-zinc-950 accent-zinc-950"
                                        />
                                        <span className="text-xs text-zinc-650 font-medium">Mark for Revision list</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPinned}
                                            onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                                            className="w-3.5 h-3.5 border border-zinc-300 rounded focus:ring-0 text-zinc-950 accent-zinc-950"
                                        />
                                        <span className="text-xs text-zinc-650 font-medium">Pin Note to Top</span>
                                    </label>
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-900 shadow transition-all cursor-pointer"
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

export default Notes;
