import { useContext, useState, useMemo } from 'react';
import { Plus, BookOpen, Search, Filter, ArrowUpDown, Flame, Clock, Award, BarChart2, BookOpenCheck } from 'lucide-react';
import { SubjectContext } from '../context/SubjectContext';
import { AuthContext } from '../context/AuthContext';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';

const Subjects = () => {
    const { subjects, isLoading, addSubject, updateSubject, deleteSubject } = useContext(SubjectContext);
    const { user } = useContext(AuthContext);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('updated');

    const handleCreate = async (data) => {
        try {
            await addSubject(data);
            setSubmitError('');
            setIsFormOpen(false);
        } catch (error) {
            setSubmitError(error.response?.data?.message || 'Unable to create subject.');
        }
    };

    const handleUpdate = async (data) => {
        if (!editingSubject) return;
        try {
            await updateSubject(editingSubject._id, data);
            setSubmitError('');
            setEditingSubject(null);
            setIsFormOpen(false);
        } catch (error) {
            setSubmitError(error.response?.data?.message || 'Unable to update subject.');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateSubject(id, { status: newStatus });
        } catch (error) {
            console.error('Failed to change status:', error);
        }
    };

    const onDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject? All related topics will be deleted.')) {
            await deleteSubject(id);
        }
    };

    const openCreateModal = () => {
        setEditingSubject(null);
        setSubmitError('');
        setIsFormOpen(true);
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setSubmitError('');
        setIsFormOpen(true);
    };

    const stats = useMemo(() => {
        const total = subjects.length;
        const completed = subjects.filter(sub => sub.progressPercentage === 100 && sub.totalTopics > 0).length;
        const active = subjects.filter(sub => sub.status === 'active' && sub.progressPercentage < 100).length;
        
        const totalTopics = subjects.reduce((sum, s) => sum + (s.totalTopics || 0), 0);
        const completedTopics = subjects.reduce((sum, s) => sum + (s.completedTopics || 0), 0);
        const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        const totalMinutes = subjects.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0);
        const studyHours = Math.round(totalMinutes / 60);
        
        const currentStreak = user?.currentStreak || 0;

        return {
            total,
            completed,
            active,
            completedTopics,
            overallProgress,
            studyHours,
            currentStreak
        };
    }, [subjects, user]);

    const processedSubjects = useMemo(() => {
        return subjects
            .filter(sub => {
                const q = searchQuery.toLowerCase().trim();
                const matchesSearch = !q || 
                    sub.name.toLowerCase().includes(q) ||
                    (sub.description && sub.description.toLowerCase().includes(q)) ||
                    (sub.currentTopicName && sub.currentTopicName.toLowerCase().includes(q));

                if (!matchesSearch) return false;

                if (statusFilter === 'archived') return sub.status === 'archived';
                if (sub.status === 'archived') return false;

                if (statusFilter === 'all') return true;
                if (statusFilter === 'active') return sub.status === 'active' && sub.progressPercentage < 100;
                if (statusFilter === 'completed') return sub.progressPercentage === 100 && sub.totalTopics > 0;
                if (statusFilter === 'paused') return sub.status === 'paused';

                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'progress') {
                    return (b.progressPercentage || 0) - (a.progressPercentage || 0);
                }
                if (sortBy === 'name') {
                    return a.name.localeCompare(b.name);
                }
                if (sortBy === 'completion') {
                    const daysA = Math.ceil(((a.totalTopics || 0) - (a.completedTopics || 0)) / (a.dailyTarget || 2));
                    const daysB = Math.ceil(((b.totalTopics || 0) - (b.completedTopics || 0)) / (b.dailyTarget || 2));
                    return daysA - daysB;
                }
                return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            });
    }, [subjects, searchQuery, statusFilter, sortBy]);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans text-zinc-800 bg-white min-h-screen">
            <div className="flex justify-between items-center mb-8 pb-5 border-b border-zinc-200/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-950 text-white rounded-xl shadow-sm border border-zinc-900">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Study Planning Engine</h1>
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mt-0.5">Subjects & Roadmaps</p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-900 px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm hover:-translate-y-[0.5px] active:translate-y-0 transition-all cursor-pointer border border-zinc-900"
                >
                    <Plus size={14} />
                    New Study Plan
                </button>
            </div>

            {submitError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-xs text-red-750">
                    {submitError}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl shadow-inner-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Total Plans</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-zinc-900">{stats.total}</span>
                        <span className="text-[10px] text-zinc-400">subjects</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Active Plans</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-sky-700">{stats.active}</span>
                        <span className="text-[10px] text-zinc-450">studying</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Finished Plans</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-emerald-700">{stats.completed}</span>
                        <span className="text-[10px] text-zinc-450">complete</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Topics Completed</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-indigo-700">{stats.completedTopics}</span>
                        <span className="text-[10px] text-zinc-450">topics</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Overall Progress</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-zinc-900">{stats.overallProgress}%</span>
                        <span className="text-[10px] text-zinc-450">average</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Focus studied</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-zinc-800">{stats.studyHours}h</span>
                        <span className="text-[10px] text-zinc-450">logged</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/70 p-4 rounded-xl col-span-2 md:col-span-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block select-none">Study Streak</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-xl font-black text-orange-600">{stats.currentStreak}d</span>
                        <span className="text-[10px] text-zinc-450">streak 🔥</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-zinc-50 border border-zinc-200/50 p-4 rounded-xl">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search subjects, topics, or checklist tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-lg border border-zinc-250 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
                    />
                    <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white p-1 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-500">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'active', label: 'Active' },
                            { id: 'completed', label: 'Completed' },
                            { id: 'paused', label: 'Paused' },
                            { id: 'archived', label: 'Archived' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1 rounded transition-colors cursor-pointer select-none ${
                                    statusFilter === tab.id
                                        ? 'bg-zinc-950 text-white font-bold'
                                        : 'hover:text-zinc-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative bg-white border border-zinc-200 rounded-lg p-1 flex items-center gap-1">
                        <ArrowUpDown size={12} className="text-zinc-400 ml-1.5" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-zinc-650 outline-none pr-6 cursor-pointer appearance-none py-1 pl-1"
                        >
                            <option value="updated">Recently Updated</option>
                            <option value="progress">Highest Progress</option>
                            <option value="name">Alphabetical (A-Z)</option>
                            <option value="completion">Estimated Finish</option>
                        </select>
                    </div>
                </div>
            </div>

            {isLoading && subjects.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="bg-zinc-50 border border-zinc-200 rounded-xl h-64 p-5 flex flex-col justify-between">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 bg-zinc-200 rounded-lg"></div>
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-zinc-250 rounded w-3/4"></div>
                                    <div className="h-2 bg-zinc-200 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 bg-zinc-200 rounded"></div>
                                <div className="h-2 bg-zinc-200 rounded w-5/6"></div>
                            </div>
                            <div className="h-8 bg-zinc-250 rounded w-1/3 self-end"></div>
                        </div>
                    ))}
                </div>
            ) : processedSubjects.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-zinc-250 p-16 text-center select-none max-w-2xl mx-auto mt-8">
                    <div className="w-12 h-12 bg-zinc-50 text-zinc-400 rounded-xl border border-zinc-200 flex items-center justify-center mx-auto mb-4 shadow-inner-sm">
                        <BookOpen size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">No study plans matching criteria</h3>
                    <p className="text-xs text-zinc-450 max-w-sm mx-auto mb-6">
                        Create a new subject plan to generate structured syllabus templates and map out your daily study timeline automatically.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg cursor-pointer"
                    >
                        <Plus size={14} /> Create a Study Plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {processedSubjects.map((subject) => (
                        <SubjectCard
                            key={subject._id}
                            subject={subject}
                            onDelete={onDelete}
                            onEdit={openEditModal}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}

            <SubjectForm
                isOpen={isFormOpen}
                onClose={() => {
                    setSubmitError('');
                    setIsFormOpen(false);
                }}
                onSubmit={editingSubject ? handleUpdate : handleCreate}
                initialData={editingSubject}
                subjects={subjects}
            />
        </div>
    );
};

export default Subjects;
