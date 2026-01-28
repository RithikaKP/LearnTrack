import { useState, useEffect, useContext } from 'react';
import {
    Plus, Search, ExternalLink, Code, CheckCircle, Clock, RotateCcw,
    Filter, X, BookOpen, BarChart2, PieChart
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import problemService from '../context/problemService';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';

const PLATFORMS = ['All', 'LeetCode', 'CodeForces', 'HackerRank', 'GeeksforGeeks', 'CodeChef', 'AtCoder', 'Custom'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'to do', 'solved', 'reviewing'];
const CATEGORIES = ['All', 'Array', 'String', 'Tree', 'Graph', 'DP', 'Greedy', 'Backtracking', 'Math', 'Other'];

const PLATFORM_COLORS = {
    LeetCode: 'bg-orange-100 text-orange-700',
    CodeForces: 'bg-blue-100 text-blue-700',
    HackerRank: 'bg-green-100 text-green-700',
    GeeksforGeeks: 'bg-green-50 text-green-600',
    CodeChef: 'bg-amber-100 text-amber-800',
    AtCoder: 'bg-gray-100 text-gray-800',
    Custom: 'bg-gray-50 text-gray-600'
};

const DIFFICULTIES_COLORS = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700'
};

const STATUS_ICONS = {
    'to do': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    solved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    reviewing: { icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50' }
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
                problemService.getProblems(filters, user.token),
                problemService.getStats(user.token)
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
    }, [user, filters]); // Re-fetch when filters change

    // Handlers
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this problem?')) {
            try {
                await problemService.deleteProblem(id, user.token);
                fetchData(); // Refresh list & stats
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
                await problemService.updateProblem(editingProblem._id, payload, user.token);
            } else {
                await problemService.createProblem(payload, user.token);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    // Chart Data Helpers
    const chartData = stats ? stats.difficulty.map(d => ({ name: d.name, value: d.value })) : [];
    const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Easy, Medium, Hard colors somewhat matching

    return (
        <div className="w-full px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Code className="text-indigo-600" /> Coding Problems
            </h1>

            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Total Problems</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Solved</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{stats.solved}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Solve Rate</p>
                        <p className="text-3xl font-bold text-indigo-600 mt-1">
                            {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
                        </p>
                    </div>
                    {/* Tiny Chart */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <div className="w-24 h-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie data={chartData} innerRadius={15} outerRadius={35} paddingAngle={5} dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-xs text-gray-400 ml-2"> Difficulty <br /> Dist.</div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between flex-wrap gap-4">
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm w-48 focus:w-64 transition-all outline-none focus:border-indigo-500"
                        />
                    </div>

                    {[
                        { name: 'platform', options: PLATFORMS },
                        { name: 'difficulty', options: DIFFICULTIES },
                        { name: 'status', options: STATUSES },
                    ].map(f => (
                        <select
                            key={f.name}
                            value={filters[f.name]}
                            onChange={(e) => handleFilterChange(f.name, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ))}
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 shadow-md hover:translate-y-0.5 transition-all"
                >
                    <Plus size={18} /> Add Problem
                </button>
            </div>

            {/* Problem Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500"></div>
                </div>
            ) : problems.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <Code size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No problems found</h3>
                    <p className="text-gray-500 mt-1">Adjust filters or add a new problem to track.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {problems.map(problem => {
                        const StatusConf = STATUS_ICONS[problem.status] || STATUS_ICONS['to do'];
                        const SIcon = StatusConf.icon;

                        return (
                            <div key={problem._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                                <span className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded ${PLATFORM_COLORS[problem.platform] || 'bg-gray-100'}`}>
                                    {problem.platform}
                                </span>

                                <div className="pr-12 mb-3">
                                    <h3 className="font-bold text-gray-800 line-clamp-1" title={problem.title}>
                                        {problem.title}
                                    </h3>
                                    <a
                                        href={problem.url}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        View Problem <ExternalLink size={10} />
                                    </a>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${DIFFICULTIES_COLORS[problem.difficulty]}`}>
                                        {problem.difficulty}
                                    </span>
                                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium ${StatusConf.color} ${StatusConf.bg}`}>
                                        <SIcon size={12} /> {problem.status}
                                    </span>
                                </div>

                                {problem.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {problem.tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(problem)}
                                        className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(problem._id)}
                                        className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{editingProblem ? 'Edit Problem' : 'Track New Problem'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Platform</label>
                                    <select name="platform" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} className="input-field">
                                        {PLATFORMS.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Difficulty</label>
                                    <select name="difficulty" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className="input-field">
                                        {DIFFICULTIES.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Problem Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field" placeholder="Two Sum" />
                            </div>

                            <div>
                                <label className="label">Problem URL</label>
                                <input type="url" required value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} className="input-field" placeholder="https://leetcode.com/..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Category</label>
                                    <select name="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input-field">
                                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select name="status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="input-field">
                                        {STATUSES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Tags <span className="text-gray-400 text-xs font-normal">(comma separated)</span></label>
                                <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="input-field" placeholder="hash-map, array" />
                            </div>

                            <div>
                                <label className="label">Notes / Approach</label>
                                <textarea rows="3" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input-field" placeholder="Observations.."></textarea>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Save Problem</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
                .input-field { width: 100%; padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid #E5E7EB; outline: none; }
                .input-field:focus { border-color: #6366F1; ring: 2px; }
            `}</style>
        </div>
    );
};

export default ProblemTracker;
