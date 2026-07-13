import { useState, useEffect, useContext } from 'react';
import {
    Search, ExternalLink, Code, CheckCircle2, Circle, RefreshCw,
    X, Flame, Star, Check, ChevronLeft, ChevronRight, ChevronDown, Sparkles,
    Plus, Calendar, BookOpen, Trash2, ArrowRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import problemService from '../context/problemService';

const PLATFORMS = ['LeetCode', 'Codeforces', 'HackerRank', 'GeeksforGeeks', 'CodeChef', 'AtCoder'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const TOPICS = [
    'All', 'Array', 'String', 'Tree', 'Graph', 'DP', 'Greedy',
    'Backtracking', 'Math', 'Bit Manipulation', 'Sorting',
    'Searching', 'Linked List', 'Stack', 'Queue', 'Heap',
    'Hash Table', 'Design', 'Other'
];
const SORTS = ['Target/Solved Date', 'Name (A-Z)', 'Name (Z-A)', 'Difficulty (Easy → Hard)', 'Difficulty (Hard → Easy)'];

const PLATFORM_COLORS = {
    LeetCode: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    Codeforces: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    CodeForces: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    HackerRank: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    GeeksforGeeks: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    CodeChef: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    AtCoder: 'bg-zinc-100 text-zinc-700 border-zinc-255 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    Custom: 'bg-zinc-50 text-zinc-650 border-zinc-100 dark:bg-zinc-900/50'
};

const DIFFICULTY_BADGES = {
    Easy: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400',
    Medium: 'bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400',
    Hard: 'bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:text-rose-400'
};

const ProblemTracker = () => {
    const { user } = useContext(AuthContext);

    const [problems, setProblems] = useState([]);
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('solved');

    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncNotification, setSyncNotification] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [connectPlatformInput, setConnectPlatformInput] = useState({ platform: '', username: '' });
    const [isConnecting, setIsConnecting] = useState(false);

    const [formData, setFormData] = useState({
        platform: 'LeetCode',
        title: '',
        url: '',
        difficulty: 'Medium',
        targetDate: '',
        notes: ''
    });
    const [isSavingProblem, setIsSavingProblem] = useState(false);

    const [starredIds, setStarredIds] = useState(() => {
        try {
            const saved = localStorage.getItem('learntrack_starred_problems');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [selectedSort, setSelectedSort] = useState('Target/Solved Date');
    const [filterStarredOnly, setFilterStarredOnly] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadData = async () => {
        setLoading(true);
        try {
            const [problemsData, platformsData] = await Promise.all([
                problemService.getProblems({}),
                problemService.getConnectedPlatforms()
            ]);
            setProblems(problemsData);
            setConnectedPlatforms(platformsData);
        } catch (error) {
            console.error('Failed to load practice data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleStar = (problemId) => {
        setStarredIds(prev => {
            const updated = prev.includes(problemId)
                ? prev.filter(id => id !== problemId)
                : [...prev, problemId];
            localStorage.setItem('learntrack_starred_problems', JSON.stringify(updated));
            return updated;
        });
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!connectPlatformInput.username.trim()) return;
        setIsConnecting(true);
        try {
            const updated = await problemService.connectPlatform(connectPlatformInput);
            setConnectedPlatforms(updated);
            setConnectPlatformInput({ platform: '', username: '' });
        } catch (error) {
            console.error('Failed to connect platform:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async (platformName) => {
        try {
            const updated = await problemService.disconnectPlatform({ platform: platformName });
            setConnectedPlatforms(updated);
        } catch (error) {
            console.error('Failed to disconnect platform:', error);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await problemService.syncPlatforms();
            if (result.success) {
                await loadData();
                if (result.newlySolved && result.newlySolved.length > 0) {
                    setSyncNotification(result.newlySolved[0]);
                    setTimeout(() => setSyncNotification(null), 6000);
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteProblem = async (problemId) => {
        if (!window.confirm('Are you sure you want to remove this problem?')) return;
        try {
            await problemService.deleteProblem(problemId);
            setProblems(prev => prev.filter(p => p._id !== problemId));
        } catch (error) {
            console.error('Failed to delete problem:', error);
        }
    };

    const handleAddProblem = async (e) => {
        e.preventDefault();
        const { platform, title, url, difficulty, targetDate, notes } = formData;
        if (!title || !url || !targetDate) return;

        setIsSavingProblem(true);
        try {
            const payload = {
                title,
                platform,
                difficulty,
                category: 'Other',
                tags: [],
                url,
                status: 'planned',
                targetDate,
                notes
            };
            const created = await problemService.createProblem(payload);
            setProblems(prev => [created, ...prev]);
            setIsAddModalOpen(false);
            setFormData({
                platform: 'LeetCode',
                title: '',
                url: '',
                difficulty: 'Medium',
                targetDate: '',
                notes: ''
            });
        } catch (error) {
            console.error('Failed to add planned problem:', error);
        } finally {
            setIsSavingProblem(false);
        }
    };

    const isPlatformConnected = (platformName) => {
        return connectedPlatforms.some(p => p.platform === platformName);
    };

    const getPlatformUsername = (platformName) => {
        const found = connectedPlatforms.find(p => p.platform === platformName);
        return found ? found.username : '';
    };

    const solvedProblems = problems.filter(p => p.status === 'solved');
    const solvedProblemsCount = solvedProblems.length;
    const easyCount = solvedProblems.filter(p => p.difficulty === 'Easy').length;
    const mediumCount = solvedProblems.filter(p => p.difficulty === 'Medium').length;
    const hardCount = solvedProblems.filter(p => p.difficulty === 'Hard').length;
    const currentStreak = user?.currentStreak || 0;

    const tabFilteredProblems = problems.filter(p => {
        if (activeTab === 'solved') return p.status === 'solved';
        if (activeTab === 'queue') return p.status === 'planned';
        return true;
    });

    const filteredProblems = tabFilteredProblems.filter(problem => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const titleMatch = problem.title?.toLowerCase().includes(term);
            const tagMatch = problem.tags?.some(tag => tag.toLowerCase().includes(term));
            const categoryMatch = problem.category?.toLowerCase().includes(term);
            if (!titleMatch && !tagMatch && !categoryMatch) return false;
        }

        if (selectedPlatform !== 'All') {
            if (problem.platform?.toLowerCase() !== selectedPlatform.toLowerCase()) return false;
        }

        if (selectedDifficulty !== 'All') {
            if (problem.difficulty !== selectedDifficulty) return false;
        }

        if (selectedTopic !== 'All') {
            const matchCategory = problem.category === selectedTopic;
            const matchTags = problem.tags?.some(t => t.toLowerCase() === selectedTopic.toLowerCase());
            if (!matchCategory && !matchTags) return false;
        }

        if (filterStarredOnly && !starredIds.includes(problem._id)) return false;

        return true;
    });

    const sortedProblems = [...filteredProblems].sort((a, b) => {
        switch (selectedSort) {
            case 'Target/Solved Date': {
                const dateA = new Date(a.solvedAt || a.targetDate || a.createdAt || 0);
                const dateB = new Date(b.solvedAt || b.targetDate || b.createdAt || 0);
                return dateB - dateA;
            }
            case 'Name (A-Z)':
                return (a.title || '').localeCompare(b.title || '');
            case 'Name (Z-A)':
                return (b.title || '').localeCompare(a.title || '');
            case 'Difficulty (Easy → Hard)': {
                const diffWeights = { Easy: 1, Medium: 2, Hard: 3 };
                return diffWeights[a.difficulty] - diffWeights[b.difficulty];
            }
            case 'Difficulty (Hard → Easy)': {
                const diffWeights = { Easy: 1, Medium: 2, Hard: 3 };
                return diffWeights[b.difficulty] - diffWeights[a.difficulty];
            }
            default:
                return 0;
        }
    });

    const totalItems = sortedProblems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedProblems = sortedProblems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans text-zinc-900 bg-[#FAFAFA] min-h-screen">
            
            {syncNotification && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="p-2 bg-emerald-500 rounded-xl text-white shadow-sm flex items-center justify-center">
                            <Sparkles size={16} />
                        </span>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-950">🎉 Great Job!</h4>
                            <p className="text-xs text-emerald-700 mt-0.5">
                                <span className="font-semibold">"{syncNotification.title}"</span> was detected as solved on <span className="font-semibold">{syncNotification.platform}</span>. It has been moved from your Practice Queue to Solved Problems.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSyncNotification(null)}
                        className="text-emerald-500 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200/80">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-950 rounded-2xl text-white shadow-md">
                        <Code size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Practice</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Automatically sync solved problems and plan your practice queue.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-white text-zinc-700 hover:text-zinc-950 px-4 py-2 border border-zinc-200 hover:border-zinc-300 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                        Sync Platforms
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 bg-zinc-950 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                        <Plus size={14} />
                        Add to Practice Queue
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 bg-white border border-zinc-200 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Synced Solved</span>
                            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                                <CheckCircle2 size={12} />
                            </span>
                        </div>
                        <div className="text-2xl font-black text-zinc-950 mt-2">{solvedProblemsCount}</div>
                        <p className="text-[10px] text-zinc-450 mt-1">From active connections</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Daily Streak</span>
                            <span className="p-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100/50">
                                <Flame size={12} className="fill-orange-600" />
                            </span>
                        </div>
                        <div className="text-2xl font-black text-zinc-950 mt-2">{currentStreak} Days</div>
                        <p className="text-[10px] text-zinc-450 mt-1">Keep it up!</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Easy</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></span>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 mt-2">{easyCount}</div>
                        <p className="text-[10px] text-zinc-450 mt-1">Foundational skills</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Medium</span>
                            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1"></span>
                        </div>
                        <div className="text-2xl font-black text-amber-600 mt-2">{mediumCount}</div>
                        <p className="text-[10px] text-zinc-455 mt-1">Core design patterns</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Hard</span>
                            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1"></span>
                        </div>
                        <div className="text-2xl font-black text-rose-600 mt-2">{hardCount}</div>
                        <p className="text-[10px] text-zinc-455 mt-1">Advanced structures</p>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-1 border-b border-zinc-200 mb-6">
                <button
                    onClick={() => { setActiveTab('solved'); setCurrentPage(1); }}
                    className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'solved'
                            ? 'border-zinc-950 text-zinc-950'
                            : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                >
                    Solved Problems ({problems.filter(p => p.status === 'solved').length})
                </button>
                <button
                    onClick={() => { setActiveTab('queue'); setCurrentPage(1); }}
                    className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'queue'
                            ? 'border-zinc-950 text-zinc-950'
                            : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                >
                    Practice Queue ({problems.filter(p => p.status === 'planned').length})
                </button>
            </div>

            <div className="bg-white border border-zinc-200/80 p-3 rounded-2xl mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
                <div className="relative w-full lg:max-w-xs">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-450" />
                    <input
                        type="text"
                        placeholder="Search problems or tags..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl hover:border-zinc-300 transition-all outline-none focus:border-zinc-800 focus:bg-white"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <div className="relative">
                        <select
                            value={selectedPlatform}
                            onChange={(e) => { setSelectedPlatform(e.target.value); setCurrentPage(1); }}
                            className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none hover:border-zinc-300 hover:text-zinc-950 transition-all cursor-pointer"
                        >
                            <option value="All">Platform: All</option>
                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => { setSelectedDifficulty(e.target.value); setCurrentPage(1); }}
                            className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none hover:border-zinc-300 hover:text-zinc-950 transition-all cursor-pointer"
                        >
                            {DIFFICULTIES.map(d => <option key={d} value={d}>Difficulty: {d}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedTopic}
                            onChange={(e) => { setSelectedTopic(e.target.value); setCurrentPage(1); }}
                            className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none hover:border-zinc-300 hover:text-zinc-950 transition-all cursor-pointer"
                        >
                            {TOPICS.map(t => <option key={t} value={t}>Topic: {t}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedSort}
                            onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
                            className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none hover:border-zinc-300 hover:text-zinc-950 transition-all cursor-pointer"
                        >
                            {SORTS.map(s => <option key={s} value={s}>Sort: {s}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => { setFilterStarredOnly(!filterStarredOnly); setCurrentPage(1); }}
                        className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                            filterStarredOnly 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300'
                        }`}
                        title={filterStarredOnly ? 'Showing starred only' : 'Show starred only'}
                    >
                        <Star size={13} className={filterStarredOnly ? 'fill-amber-500 text-amber-500' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="border border-zinc-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-10 bg-zinc-50 border-b border-zinc-200"></div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-white border-b border-zinc-200 animate-pulse flex items-center px-4 gap-4">
                            <div className="h-4 w-6 bg-zinc-100 rounded"></div>
                            <div className="h-4 w-4 bg-zinc-100 rounded-full"></div>
                            <div className="h-4 w-48 bg-zinc-150 rounded"></div>
                            <div className="h-4 w-16 bg-zinc-100 rounded ml-auto"></div>
                        </div>
                    ))}
                </div>
            ) : totalItems === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-200 select-none">
                    <Sparkles size={36} className="mx-auto text-zinc-300 mb-3" />
                    <h3 className="text-sm font-semibold text-zinc-950">No problems found</h3>
                    <p className="text-xs text-zinc-500 mt-1.5 mb-4 max-w-xs mx-auto leading-normal">
                        {activeTab === 'solved' 
                            ? 'Connect your coding platforms to automatically sync and import your solved problems.'
                            : 'Plan your future coding targets by adding problems to the practice queue.'}
                    </p>
                    {activeTab === 'solved' ? (
                        <button 
                            onClick={() => setIsSyncModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-zinc-950 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-800 shadow transition-all cursor-pointer"
                        >
                            <RefreshCw size={12} />
                            Connect Platforms
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 bg-zinc-950 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-800 shadow transition-all cursor-pointer"
                        >
                            <Plus size={14} />
                            Add to Practice Queue
                        </button>
                    )}
                </div>
            ) : (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
                                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                                    <th className="py-3.5 px-3 w-16 text-center">Status</th>
                                    <th className="py-3.5 px-4 w-[35%]">Problem Name</th>
                                    <th className="py-3.5 px-4 w-28">Difficulty</th>
                                    <th className="py-3.5 px-4 w-28">Platform</th>
                                    <th className="py-3.5 px-4 w-[25%]">Topics</th>
                                    {activeTab === 'queue' && (
                                        <>
                                            <th className="py-3.5 px-4 w-32">Target Date</th>
                                            <th className="py-3.5 px-4 w-44">Notes</th>
                                        </>
                                    )}
                                    <th className="py-3.5 px-4 w-14 text-center">⭐</th>
                                    {activeTab === 'queue' && (
                                        <th className="py-3.5 px-4 w-14 text-center">Delete</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                                {paginatedProblems.map((problem, index) => {
                                    const isStarred = starredIds.includes(problem._id);
                                    const isSolved = problem.status === 'solved';
                                    const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;

                                    return (
                                        <tr key={problem._id} className="hover:bg-zinc-50/40 transition-colors group">
                                            <td className="py-3 px-4 text-center font-medium text-zinc-450">{rowIndex}</td>
                                            
                                            <td className="py-3 px-3 text-center">
                                                <div className="flex justify-center">
                                                    {isSolved ? (
                                                        <span className="inline-flex p-0.5 bg-emerald-50 text-emerald-600 rounded-full" title="Solved">
                                                            <CheckCircle2 size={15} className="fill-emerald-50" />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex p-0.5 bg-amber-50 text-amber-600 rounded-full" title="Planned">
                                                            <Circle size={15} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 font-semibold text-zinc-900 truncate">
                                                <div className="flex items-center gap-1.5">
                                                    <a
                                                        href={problem.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-zinc-950 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                        title={problem.title}
                                                    >
                                                        {problem.title}
                                                        <ExternalLink size={10} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-150" />
                                                    </a>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide ${DIFFICULTY_BADGES[problem.difficulty] || 'bg-zinc-100 text-zinc-700'}`}>
                                                    {problem.difficulty}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${PLATFORM_COLORS[problem.platform] || PLATFORM_COLORS.Custom}`}>
                                                    {problem.platform}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1 items-center max-w-full">
                                                    {problem.category && problem.category !== 'Other' && (
                                                        <span className="text-[10px] font-medium bg-zinc-100 text-zinc-650 px-1.5 py-0.5 rounded-md select-none">
                                                            {problem.category}
                                                        </span>
                                                    )}
                                                    {problem.tags?.slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="text-[10px] font-medium bg-zinc-50 border border-zinc-150 text-zinc-500 px-1.5 py-0.5 rounded-md select-none">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {(!problem.category || problem.category === 'Other') && (!problem.tags || problem.tags.length === 0) && (
                                                        <span className="text-zinc-400">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {activeTab === 'queue' && (
                                                <>
                                                    <td className="py-3 px-4 font-semibold text-zinc-600">
                                                        {formatDate(problem.targetDate)}
                                                    </td>
                                                    <td className="py-3 px-4 text-zinc-500 truncate" title={problem.notes}>
                                                        {problem.notes || '—'}
                                                    </td>
                                                </>
                                            )}

                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => toggleStar(problem._id)}
                                                    className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer select-none"
                                                    title={isStarred ? 'Unstar problem' : 'Star problem'}
                                                >
                                                    <Star size={13} className={isStarred ? 'fill-amber-400 text-amber-400' : ''} />
                                                </button>
                                            </td>

                                            {activeTab === 'queue' && (
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => handleDeleteProblem(problem._id)}
                                                        className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete problem"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-zinc-50/50 px-4 py-3 border-t border-zinc-200 flex items-center justify-between flex-col sm:flex-row gap-3">
                        <span className="text-xs text-zinc-500 font-medium select-none">
                            Showing <span className="font-semibold text-zinc-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-zinc-800">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-semibold text-zinc-800">{totalItems}</span> problems
                        </span>
                        
                        <div className="inline-flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-855 hover:border-zinc-300 disabled:opacity-40 disabled:hover:text-zinc-500 disabled:hover:border-zinc-200 transition-all select-none cursor-pointer"
                            >
                                <ChevronLeft size={13} />
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                if (totalPages > 5 && Math.abs(currentPage - pageNumber) > 1 && pageNumber !== 1 && pageNumber !== totalPages) {
                                    if (pageNumber === 2 || pageNumber === totalPages - 1) {
                                        return <span key={pageNumber} className="text-zinc-400 px-1 text-xs select-none">...</span>;
                                    }
                                    return null;
                                }
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all select-none cursor-pointer ${
                                            currentPage === pageNumber
                                                ? 'bg-zinc-950 text-white shadow-sm'
                                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-855 hover:border-zinc-300 disabled:opacity-40 disabled:hover:text-zinc-500 disabled:hover:border-zinc-200 transition-all select-none cursor-pointer"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSyncModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-fade-in">
                    <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-md rounded-2xl overflow-hidden animate-scale-up">
                        
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
                            <div>
                                <h2 className="text-sm font-bold text-zinc-950">Sync Coding Platforms</h2>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Manage automated integrations and platform data syncs.</p>
                            </div>
                            <button onClick={() => setIsSyncModalOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {connectPlatformInput.platform ? (
                                <form onSubmit={handleConnect} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-zinc-800">Connect to {connectPlatformInput.platform}</h4>
                                        <button 
                                            type="button" 
                                            onClick={() => setConnectPlatformInput({ platform: '', username: '' })}
                                            className="text-zinc-400 hover:text-zinc-650"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter platform username..."
                                            required
                                            value={connectPlatformInput.username}
                                            onChange={(e) => setConnectPlatformInput(prev => ({ ...prev, username: e.target.value }))}
                                            className="flex-1 bg-white border border-zinc-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isConnecting}
                                            className="bg-zinc-950 text-white px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                        >
                                            {isConnecting ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            ) : null}

                            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                                {PLATFORMS.map(platformName => {
                                    const connected = isPlatformConnected(platformName);
                                    const username = getPlatformUsername(platformName);

                                    return (
                                        <div key={platformName} className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl hover:bg-zinc-50/50 transition-colors bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center">
                                                    {connected ? (
                                                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                                                            <Check size={10} strokeWidth={3} />
                                                        </span>
                                                    ) : (
                                                        <span className="w-5 h-5 rounded-full border border-zinc-200 flex items-center justify-center bg-zinc-50"></span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold text-zinc-900">{platformName}</h4>
                                                    <p className="text-[9px] text-zinc-400 mt-0.5">
                                                        {connected ? `Connected as: ${username}` : 'Not Connected'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (connected) {
                                                        handleDisconnect(platformName);
                                                    } else {
                                                        setConnectPlatformInput({ platform: platformName, username: '' });
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors select-none cursor-pointer ${
                                                    connected
                                                        ? 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                                        : 'bg-zinc-950 border-zinc-950 text-white hover:bg-zinc-800'
                                                }`}
                                            >
                                                {connected ? 'Disconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-[10px] text-zinc-400 leading-normal border-t border-zinc-100 pt-3.5">
                                LearnTrack connects directly to public APIs to automatically sync your solved problems metadata. We never store passwords or modify coding platform accounts.
                            </p>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSyncModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-650 hover:bg-zinc-100 transition-colors cursor-pointer select-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSync}
                                    disabled={isSyncing || connectedPlatforms.length === 0}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-955 text-white border border-zinc-950 rounded-lg text-xs font-semibold hover:bg-zinc-900 disabled:bg-zinc-100 disabled:border-zinc-200 disabled:text-zinc-400 shadow transition-all cursor-pointer select-none"
                                >
                                    <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-fade-in">
                    <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-lg rounded-2xl overflow-hidden animate-scale-up">
                        
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
                            <div>
                                <h2 className="text-sm font-bold text-zinc-950">Add to Practice Queue</h2>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Plan and schedule coding problems you want to solve later.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer">
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleAddProblem} className="p-5 space-y-4">
                            
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Select Coding Platform</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, platform: p }))}
                                            className={`py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                                                formData.platform === p
                                                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100/70 hover:text-zinc-900'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Problem Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter problem name (e.g. Two Sum)"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-850 focus:bg-white focus:ring-1 focus:ring-zinc-800 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Problem URL</label>
                                <input
                                    type="url"
                                    placeholder="Enter problem URL on coding platform"
                                    required
                                    value={formData.url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-850 focus:bg-white focus:ring-1 focus:ring-zinc-800 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Difficulty</label>
                                <div className="relative">
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                                        className="appearance-none w-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 outline-none hover:border-zinc-300 hover:text-zinc-955 focus:bg-white focus:border-zinc-850 focus:ring-1 focus:ring-zinc-800 transition-all cursor-pointer"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Target Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            required
                                            value={formData.targetDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-800 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Notes (Optional)</label>
                                    <textarea
                                        placeholder="Add notes, strategies or constraints..."
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-800 focus:bg-white transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-650 hover:bg-zinc-100 transition-colors cursor-pointer select-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingProblem || !formData.title || !formData.url || !formData.targetDate}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-950 text-white border border-zinc-950 rounded-xl text-xs font-semibold hover:bg-zinc-800 disabled:bg-zinc-100 disabled:border-zinc-200 disabled:text-zinc-400 shadow transition-all cursor-pointer select-none"
                                >
                                    {isSavingProblem ? 'Adding...' : 'Add to Practice Queue'}
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
