import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const ICONS = ['📚', '💻', '🎯', '🧠', '⚡', '🚀', '📊', '🔬', '🎨', '🌟'];

const SubjectForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        dailyTarget: 2,
        color: COLORS[0],
        icon: ICONS[0]
    });

    useEffect(() => {
        if (initialData) {
            // Format dates for input[type="date"]
            const formatDate = (dateString) => {
                if (!dateString) return '';
                return new Date(dateString).toISOString().split('T')[0];
            };

            setFormData({
                ...initialData,
                startDate: formatDate(initialData.startDate),
                endDate: formatDate(initialData.endDate)
            });
        } else {
            setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                dailyTarget: 2,
                color: COLORS[0],
                icon: ICONS[0]
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Subject' : 'New Subject'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name & Icon */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                placeholder="e.g. Data Structures"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                            <div className="relative group">
                                <select
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleChange}
                                    className="appearance-none w-16 px-4 py-2 rounded-xl border border-gray-200 text-center bg-white cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                >
                                    {ICONS.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xl">
                                    {formData.icon}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                            placeholder="What is this subject about?"
                        />
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                />
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                />
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Daily Target */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Daily Target <span className="text-gray-400 text-xs font-normal">(topics per day)</span>
                        </label>
                        <input
                            type="number"
                            name="dailyTarget"
                            value={formData.dailyTarget}
                            onChange={handleChange}
                            min="1"
                            required
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Label</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                        >
                            {initialData ? 'Save Changes' : 'Create Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubjectForm;
