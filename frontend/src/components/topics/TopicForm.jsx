import { useState } from 'react';
import { X, Plus, Trash2, Link as LinkIcon } from 'lucide-react';

const RESOURCE_TYPES = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'article', label: 'Article' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'pdf', label: 'PDF' },
    { value: 'other', label: 'Other' }
];

const DIFFICULTIES = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
];

const buildInitialFormData = (initialData, nextDayNumber) => {
    if (initialData) {
        return initialData;
    }

    return {
        name: '',
        dayNumber: nextDayNumber || 1,
        difficulty: 'medium',
        notes: '',
        resources: []
    };
};

const TopicForm = ({ isOpen, onClose, onSubmit, initialData, nextDayNumber }) => {
    const [formData, setFormData] = useState(() => buildInitialFormData(initialData, nextDayNumber));

    const [newResource, setNewResource] = useState({ type: 'other', title: '', url: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddResource = () => {
        if (!newResource.title || !newResource.url) return;
        setFormData(prev => ({
            ...prev,
            resources: [...prev.resources, newResource]
        }));
        setNewResource({ type: 'other', title: '', url: '' });
    };

    const removeResource = (index) => {
        setFormData(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Topic' : 'Add New Topic'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="w-24">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Day #</label>
                            <input
                                type="number"
                                name="dayNumber"
                                value={formData.dayNumber}
                                onChange={handleChange}
                                min="1"
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Binary Trees Introduction"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <div className="flex gap-4">
                            {DIFFICULTIES.map(diff => (
                                <label key={diff.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        value={diff.value}
                                        checked={formData.difficulty === diff.value}
                                        onChange={handleChange}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">{diff.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Key takeaways or things to remember..."
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Resources</label>

                        <div className="space-y-2 mb-4">
                            {formData.resources.map((res, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                    <span className="text-xs font-bold uppercase text-gray-500 w-20 shrink-0">{res.type}</span>
                                    <a href={res.url} target="_blank" className="flex-1 text-sm text-indigo-600 truncate hover:underline">{res.title}</a>
                                    <button
                                        type="button"
                                        onClick={() => removeResource(idx)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {formData.resources.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No resources added yet.</p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <select
                                value={newResource.type}
                                onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                            >
                                {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="Link Title"
                                value={newResource.title}
                                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                            />
                            <input
                                type="url"
                                placeholder="URL"
                                value={newResource.url}
                                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleAddResource}
                                disabled={!newResource.title || !newResource.url}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">
                            {initialData ? 'Save Changes' : 'Add Topic'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TopicForm;
