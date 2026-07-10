import { useState, useEffect, useContext } from 'react';
import {
    Plus, Search, ExternalLink, Code, CheckCircle, Clock, RotateCcw,
    X, BookOpen, BarChart2, Edit2, Trash2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import problemService from '../context/problemService';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PLATFORMS = ['All', 'LeetCode', 'CodeForces', 'HackerRank', 'GeeksforGeeks', 'CodeChef', 'AtCoder', 'Custom'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'to do', 'solved', 'reviewing'];
const CATEGORIES = ['All', 'Array', 'String', 'Tree', 'Graph', 'DP', 'Greedy', 'Backtracking', 'Math', 'Other'];

const PLATFORM_COLORS = {
    LeetCode: 'bg-orange-50 border border-orange-100 text-orange-700',
    CodeForces: 'bg-blue-50 border border-blue-100 text-blue-700',
    HackerRank: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
    GeeksforGeeks: 'bg-emerald-50/50 border border-emerald-200/40 text-emerald-600',
    CodeChef: 'bg-amber-50 border border-amber-100 text-amber-800',
    AtCoder: 'bg-zinc-50 border border-zinc-200 text-zinc-800',
    Custom: 'bg-zinc-100/50 border border-zinc-200/20 text-zinc-650'
};

const DIFFICULTIES_COLORS = {
    Easy: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    Medium: 'bg-amber-50 text-amber-700 border border-amber-100',
    Hard: 'bg-red-50 text-red-700 border border-red-100'
};

const STATUS_ICONS = {
    'to do': { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-100/50' },
    solved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100/50' },
    reviewing: { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100/50' }
};

const ProblemTracker = () => {
    const { user } = useContext(AuthContext);

    // State
    const [problems, setProblems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        platform: 'All',
        difficulty: 'All',
        status: 'All',
        category: 'All',
        search: ''
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProblem, setEditingProblem] = useState(null);
    const [formData, setFormData] = useState({
        platform: 'LeetCode',
        title: '',
        url: '',
        difficulty: 'Medium',
        category: 'Array',
        status: 'to do',
        tags: '',
        notes: ''
    });

    // Fetch Data
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [problemsData, statsData] = await Promise.all([
                problemService.getProblems(filters),
                problemService.getStats()
            ]);
            setProblems(problemsData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, filters]);

    // Handlers
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this problem?')) {
            try {
                await problemService.deleteProblem(id);
                fetchData();
            } catch (error) {
                console.error("Delete failed");
            }
        }
    };

    const openModal = (problem = null) => {
        if (problem) {
            setEditingProblem(problem);
            setFormData({
                ...problem,
                tags: problem.tags.join(', ')
            });
        } else {
            setEditingProblem(null);
            setFormData({
                platform: 'LeetCode', title: '', url: '',
                difficulty: 'Medium', category: 'Array', status: 'to do',
                tags: '', notes: ''
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

            if (editingProblem) {
                await problemService.updateProblem(editingProblem._id, payload);
            } else {
                await problemService.createProblem(payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    // Chart Data Helpers
    const chartData = stats ? stats.difficulty.map(d => ({ name: d.name, value: d.value })) : [];
    const COLORS = ['#10B981', '#F59E0B', '#EF4444']; 

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans text-zinc-800 bg-white min-h-screen">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-200/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 border border-zinc-200/50">
                        <Code size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Practice Log</h1>
                        <p className="text-sm text-zinc-500">Track and review coding problems across platforms.</p>
                    </div>
                </div>

                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center gap-2 bg-zinc-950 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-900 shadow-sm hover:translate-y-[-0.5px] active:translate-y-0 transition-all cursor-pointer"
                >
                    <Plus size={16} /> Track a Problem
                </button>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Problems</p>
                        <p className="text-2xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Solved</p>
                        <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats.solved}</p>
                    </div>
                    <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Solve Rate</p>
                        <p className="text-2xl font-semibold text-zinc-900 mt-1">
                            {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
                        </p>
                    </div>
                    {/* Tiny Chart */}
                    <div className="bg-white border border-zinc-200/60 rounded-xl p-3 shadow-sm hover:shadow-md/5 transition-all flex items-center justify-between">
                        <div className="w-16 h-16 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie data={chartData} innerRadius={10} outerRadius={22} paddingAngle={4} dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right pr-1"> 
                            Difficulty <br /> Distribution
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Filter Bar */}
            <div className="bg-white border border-zinc-200/60 p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search problems..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-all outline-none focus:border-zinc-800 shadow-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    {[
                        { name: 'platform', options: PLATFORMS },
                        { name: 'difficulty', options: DIFFICULTIES },
                        { name: 'status', options: STATUSES },
                    ].map(f => (
                        <select
                            key={f.name}
                            value={filters[f.name]}
                            onChange={(e) => handleFilterChange(f.name, e.target.value)}
                            className="bg-zinc-50/50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg p-2.5 outline-none cursor-pointer hover:border-zinc-300 transition-colors shadow-sm"
                        >
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {/* Problem Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-950 border-t-transparent"></div>
                </div>
            ) : problems.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200 select-none">
                    <Code size={36} className="mx-auto text-zinc-300 mb-3 animate-pulse" />
                    <h3 className="text-sm font-semibold text-zinc-900">No problems found</h3>
                    <p className="text-xs text-zinc-500 mt-1">Adjust your filter options or track a new coding problem.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {problems.map(problem => {
                        const StatusConf = STATUS_ICONS[problem.status] || STATUS_ICONS['to do'];
                        const SIcon = StatusConf.icon;

                        return (
                            <div key={problem._id} className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm hover:shadow-md/5 transition-all relative flex flex-col justify-between h-48 group">
                                <span className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm ${PLATFORM_COLORS[problem.platform] || 'bg-zinc-100 text-zinc-800'}`}>
                                    {problem.platform}
                                </span>

                                <div>
                                    <div className="pr-16 mb-2">
                                        <h3 className="font-semibold text-zinc-800 text-sm truncate" title={problem.title}>
                                            {problem.title}
                                        </h3>
                                        <a
                                            href={problem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-zinc-500 hover:text-zinc-950 hover:underline inline-flex items-center gap-0.5 mt-0.5 font-medium"
                                        >
                                            View Source Link <ExternalLink size={9} />
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DIFFICULTIES_COLORS[problem.difficulty]}`}>
                                            {problem.difficulty}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${StatusConf.bg} ${StatusConf.color}`}>
                                            <SIcon size={10} /> {problem.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    {problem.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3.5">
                                            {problem.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-150/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openModal(problem)}
                                            className="p-1 hover:text-zinc-900 rounded text-zinc-400 transition-colors cursor-pointer"
                                            title="Edit Problem"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(problem._id)}
                                            className="p-1 hover:text-red-650 rounded text-zinc-400 transition-colors cursor-pointer"
                                            title="Delete Problem"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Form Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border border-zinc-250/50 shadow-2xl w-full max-w-lg rounded-xl overflow-hidden animate-scale-in">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                            <h2 className="text-sm font-semibold text-zinc-900">{editingProblem ? 'Edit Solved Problem' : 'Track Solved Problem'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-150/50 rounded-lg transition-colors cursor-pointer">
                                <X size={16} className="text-zinc-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Platform</label>
                                    <select 
                                        name="platform" 
                                        value={formData.platform} 
                                        onChange={e => setFormData({ ...formData, platform: e.target.value })} 
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800"
                                    >
                                        {PLATFORMS.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Difficulty</label>
                                    <select 
                                        name="difficulty" 
                                        value={formData.difficulty} 
                                        onChange={e => setFormData({ ...formData, difficulty: e.target.value })} 
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800"
                                    >
                                        {DIFFICULTIES.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Problem Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.title} 
                                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50" 
                                    placeholder="e.g. Two Sum" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Problem URL Link</label>
                                <input 
                                    type="url" 
                                    required 
                                    value={formData.url} 
                                    onChange={e => setFormData({ ...formData, url: e.target.value })} 
                                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50" 
                                    placeholder="https://leetcode.com/problems/..." 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Category</label>
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={e => setFormData({ ...formData, category: e.target.value })} 
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800"
                                    >
                                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Status</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={e => setFormData({ ...formData, status: e.target.value })} 
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800"
                                    >
                                        {STATUSES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Tags (Comma Separated)</label>
                                <input 
                                    type="text" 
                                    value={formData.tags} 
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })} 
                                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50" 
                                    placeholder="hash-map, array, dsa" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 select-none">Notes / Approach Summary</label>
                                <textarea 
                                    rows="3" 
                                    value={formData.notes} 
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50" 
                                    placeholder="Brief solution notes or details..."
                                ></textarea>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-900 shadow transition-all cursor-pointer"
                                >
                                    Save Problem
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProblemTracker;
