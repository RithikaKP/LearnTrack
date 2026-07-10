import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import dashboardService from '../context/dashboardService';
import problemService from '../context/problemService';
import noteService from '../context/noteService';
import sessionService from '../context/sessionService';
import {
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
    Clock, BookOpen, CheckCircle, Flame, RefreshCw,
    Activity, Code, Brain, Plus, Calendar, Bell, Sparkles, Search, User, FileText, ChevronRight, X, ArrowRight, MessageSquare
} from 'lucide-react';
import ActivityCalendar from '../components/dashboard/ActivityCalendar';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [problems, setProblems] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [notes, setNotes] = useState([]);

    // Calendar State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dailyActivity, setDailyActivity] = useState([]);
    const [loadingDaily, setLoadingDaily] = useState(false);

    // Overlays & UI States
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [commandTab, setCommandTab] = useState('menu'); // 'menu', 'problem', 'note'
    const [successMessage, setSuccessMessage] = useState('');

    // Quick Add Form States
    const [problemForm, setProblemForm] = useState({
        platform: 'LeetCode',
        title: '',
        url: '',
        difficulty: 'Medium',
        category: 'Array',
        status: 'solved',
        tags: '',
        notes: ''
    });

    const [noteForm, setNoteForm] = useState({
        title: '',
        content: '',
        tags: '',
        isRevision: false
    });

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [stats, problemsData, sessionsData, notesData] = await Promise.all([
                dashboardService.getStats(),
                problemService.getProblems({}),
                sessionService.getSessions(120, 100),
                noteService.getNotes({})
            ]);
            setData(stats);
            setProblems(problemsData);
            setSessions(sessionsData);
            setNotes(notesData);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyActivity = async (date) => {
        if (!user) return;
        setLoadingDaily(true);
        try {
            const activity = await dashboardService.getDailyActivity(date.toISOString());
            setDailyActivity(activity);
        } catch (error) {
            console.error("Failed to fetch daily activity:", error);
        } finally {
            setLoadingDaily(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    useEffect(() => {
        fetchDailyActivity(selectedDate);
    }, [selectedDate, user]);

    // Handle problem creation from Command Palette
    const handleQuickProblemSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...problemForm,
                tags: problemForm.tags.split(',').map(t => t.trim()).filter(Boolean)
            };
            await problemService.createProblem(payload);
            setSuccessMessage('Coding problem added successfully!');
            setProblemForm({
                platform: 'LeetCode', title: '', url: '',
                difficulty: 'Medium', category: 'Array', status: 'solved',
                tags: '', notes: ''
            });
            setTimeout(() => setSuccessMessage(''), 3000);
            setCommandTab('menu');
            setIsCommandPaletteOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to quick add problem:', error);
        }
    };

    // Handle note creation from Command Palette
    const handleQuickNoteSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...noteForm,
                tags: noteForm.tags.split(',').map(t => t.trim()).filter(Boolean)
            };
            await noteService.createNote(payload);
            setSuccessMessage('Scribble/Note saved successfully!');
            setNoteForm({
                title: '', content: '', tags: '', isRevision: false
            });
            setTimeout(() => setSuccessMessage(''), 3000);
            setCommandTab('menu');
            setIsCommandPaletteOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to quick add note:', error);
        }
    };

    if (loading) {
        return (
            <div className="w-full px-6 py-8 font-sans bg-white min-h-screen space-y-8">
                {/* Skeleton header */}
                <div className="flex justify-between items-center animate-pulse">
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-zinc-100 rounded-md"></div>
                        <div className="h-4 w-32 bg-zinc-50 rounded-md"></div>
                    </div>
                    <div className="h-10 w-40 bg-zinc-100 rounded-lg"></div>
                </div>
                {/* Skeleton grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-28 bg-zinc-50 rounded-xl border border-zinc-100 animate-pulse"></div>
                    ))}
                </div>
                {/* Skeleton body */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-72 bg-zinc-50 rounded-xl border border-zinc-100 animate-pulse"></div>
                    <div className="h-72 bg-zinc-50 rounded-xl border border-zinc-100 animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-10 text-center font-sans">Failed to load data. Ensure your server is active.</div>;

    const { subjects, timeStats, streaks, weeklyStudyPattern, pomodoroStats, problemStats } = data;

    // Chart Colors Matching Premium SaaS Look
    const DIFFICULTY_COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Easy (Green), Medium (Orange), Hard (Red)
    
    const difficultyData = [
        { name: 'Easy', value: problemStats.difficulty.Easy },
        { name: 'Medium', value: problemStats.difficulty.Medium },
        { name: 'Hard', value: problemStats.difficulty.Hard },
    ].filter(d => d.value > 0);

    // Compute Dynamic Greetings based on current time
    const getGreeting = () => {
        const hrs = new Date().getHours();
        if (hrs < 12) return 'Good Morning';
        if (hrs < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Calculate Weekly Solved Coding Problems for Line Chart
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const getWeeklyProblemsSolved = () => {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dStr = date.toDateString();
            const count = problems.filter(p => {
                if (p.status !== 'solved') return false;
                const solvedDate = p.solvedAt ? new Date(p.solvedAt) : new Date(p.updatedAt);
                return solvedDate.toDateString() === dStr;
            }).length;
            result.push({
                day: daysOfWeek[date.getDay()],
                solved: count
            });
        }
        return result;
    };
    const weeklyProblemsData = getWeeklyProblemsSolved();

    // Calculate Study Heatmap Data for Last 16 Weeks
    const generateHeatmapGrid = () => {
        const today = new Date();
        const start = new Date();
        // Start 15 weeks ago, aligned to Sunday
        start.setDate(today.getDate() - 15 * 7 - today.getDay());
        start.setHours(0, 0, 0, 0);

        const activityMap = {};
        
        sessions.forEach(s => {
            const dateKey = new Date(s.createdAt).toDateString();
            activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        });
        problems.forEach(p => {
            const dateKey = new Date(p.createdAt).toDateString();
            activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        });
        notes.forEach(n => {
            const dateKey = new Date(n.createdAt).toDateString();
            activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        });

        const grid = [];
        for (let day = 0; day < 7; day++) {
            const row = [];
            for (let week = 0; week < 16; week++) {
                const cellDate = new Date(start);
                cellDate.setDate(start.getDate() + week * 7 + day);
                const dateString = cellDate.toDateString();
                const count = activityMap[dateString] || 0;
                row.push({
                    date: cellDate,
                    count,
                    isFuture: cellDate > today
                });
            }
            grid.push(row);
        }
        return grid;
    };
    const heatmapGrid = generateHeatmapGrid();

    // Combine recent data into a custom activity timeline
    const getRecentTimeline = () => {
        const list = [];
        // Problems solved
        problems.slice(0, 10).forEach(p => {
            const timestamp = p.solvedAt ? new Date(p.solvedAt) : new Date(p.updatedAt);
            list.push({
                id: `problem-${p._id}`,
                type: 'problem',
                title: p.status === 'solved' ? `Solved "${p.title}"` : `Reviewed "${p.title}"`,
                subtitle: `${p.platform} • ${p.difficulty} Difficulty`,
                timestamp,
                colorClass: p.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' : p.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
                icon: Code
            });
        });
        // Sessions
        sessions.slice(0, 10).forEach(s => {
            list.push({
                id: `session-${s._id}`,
                type: 'session',
                title: `Completed Focus block`,
                subtitle: `${s.actualTime} minutes focused study session`,
                timestamp: new Date(s.createdAt),
                colorClass: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
                icon: Clock
            });
        });
        // Notes
        notes.slice(0, 10).forEach(n => {
            list.push({
                id: `note-${n._id}`,
                type: n.isRevision ? 'ai_summary' : 'note',
                title: n.isRevision ? `AI Revision Summary generated` : `Wrote note "${n.title}"`,
                subtitle: n.isRevision ? `Created a dynamic revision sheet` : `Saved in tags: ${n.tags.join(', ') || 'general'}`,
                timestamp: new Date(n.createdAt),
                colorClass: n.isRevision ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800',
                icon: n.isRevision ? Sparkles : FileText
            });
        });

        // Sort descending
        return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    };
    const timelineActivities = getRecentTimeline();

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 font-sans text-zinc-800 bg-white min-h-screen">
            
            {/* Success alert notification */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-zinc-950 text-white text-xs px-4 py-3 rounded-lg border border-zinc-800 shadow-xl flex items-center gap-2 animate-bounce">
                    <CheckCircle size={14} className="text-emerald-400 animate-pulse" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Top Navigation / Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200/50">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-900 flex items-center gap-1.5">
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'Rithika'} <span className="animate-wave inline-block select-none">👋</span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">Here is a premium overview of your learning track.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Add Bar */}
                    <div className="relative w-full max-w-xs sm:w-60">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Quick action (Click or search)..."
                            readOnly
                            onClick={() => {
                                setCommandTab('menu');
                                setIsCommandPaletteOpen(true);
                            }}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-all cursor-pointer outline-none text-zinc-600 shadow-sm"
                        />
                    </div>

                    {/* Today's Date */}
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200/60 rounded-lg bg-zinc-50/50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
                        <Calendar size={12} />
                        {new Date().toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>

                    {/* Notifications bell */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="p-2 border border-zinc-200/60 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
                        >
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-zinc-950"></span>
                        </button>
                        {isNotificationOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 shadow-xl rounded-xl p-4 z-50 text-xs font-sans">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-zinc-800">Notifications</h4>
                                    <button onClick={() => setIsNotificationOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={12} /></button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    <div className="p-2 bg-zinc-50 rounded border border-zinc-100">
                                        <p className="font-semibold text-zinc-900">Streak at risk!</p>
                                        <p className="text-[10px] text-zinc-500">Solve a coding problem or complete a focus block to save your streak.</p>
                                    </div>
                                    <div className="p-2 bg-zinc-50 rounded border border-zinc-100">
                                        <p className="font-semibold text-zinc-900">AI summary generated</p>
                                        <p className="text-[10px] text-zinc-500">Algorithms revision sheet has been completed successfully.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Refresh Data button */}
                    <button
                        onClick={fetchData}
                        className="p-2 border border-zinc-200/60 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
                        title="Refresh Stats"
                    >
                        <RefreshCw size={16} />
                    </button>

                    {/* Profile Avatar */}
                    <div className="w-8 h-8 rounded-full bg-zinc-950 text-white font-semibold text-xs flex items-center justify-center cursor-pointer select-none" title={user?.email}>
                        {user?.name?.charAt(0) || 'R'}
                    </div>
                </div>
            </div>

            {/* Premium Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                
                {/* 1. Problems Solved */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Solved</span>
                        <div className="p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                            <CheckCircle size={14} />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-zinc-900">{problemStats.solved}</div>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 bg-emerald-50 w-fit px-1 rounded">
                        {problemStats.solveRate}% solve rate
                    </p>
                </div>

                {/* 2. Problems Pending */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pending</span>
                        <div className="p-1 bg-amber-50 text-amber-600 rounded border border-amber-100">
                            <Activity size={14} />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-zinc-900">
                        {Math.max(0, problemStats.total - problemStats.solved)}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Problems in backlog</p>
                </div>

                {/* 3. Current Streak */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Streak</span>
                        <div className="p-1 bg-orange-50 text-orange-600 rounded border border-orange-100">
                            <Flame size={14} />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-zinc-900">{streaks.currentStreak} days</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Best streak: {streaks.longestStreak} days</p>
                </div>

                {/* 4. Focus Time */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Focus Time</span>
                        <div className="p-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">
                            <Clock size={14} />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-zinc-900">
                        {Math.floor(timeStats.totalTimeSpent / 60)}h {timeStats.totalTimeSpent % 60}m
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">{timeStats.averageDailyTime}m daily average</p>
                </div>

                {/* 5. Active Subjects */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subjects</span>
                        <div className="p-1 bg-zinc-100 text-zinc-900 rounded border border-zinc-200/50">
                            <BookOpen size={14} />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-zinc-900">{subjects.totalSubjects}</div>
                    <p className="text-[10px] text-zinc-400 mt-1">Active categories</p>
                </div>

                {/* 6. Weekly Progress */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm hover:shadow-md/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Overall Progress</span>
                        <div className="p-1 bg-zinc-950 text-white rounded">
                            <Brain size={14} />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-zinc-900">{subjects.progressPercentage}%</div>
                    {/* Tiny Progress Bar */}
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-200/20">
                        <div className="bg-zinc-900 h-full rounded-full" style={{ width: `${subjects.progressPercentage}%` }}></div>
                    </div>
                </div>

            </div>

            {/* Analytics Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* 1. Weekly Problems Solved Line Chart */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Code size={14} className="text-zinc-900" /> Weekly Problems Solved
                        </h3>
                    </div>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyProblemsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#18181b" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', padding: '6px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#a1a1aa', fontSize: '9px', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="solved" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorSolved)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Difficulty Distribution Donut Chart */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Brain size={14} className="text-zinc-900" /> Difficulty Distribution
                    </h3>
                    <div className="flex items-center justify-between gap-4 mt-2">
                        {difficultyData.length === 0 ? (
                            <div className="flex-1 text-center py-6 text-zinc-400 text-xs italic">No coded problems tracked.</div>
                        ) : (
                            <>
                                <div className="h-32 w-32 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={difficultyData}
                                                innerRadius={28}
                                                outerRadius={45}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {difficultyData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: '#18181b', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                                itemStyle={{ color: '#fff', fontSize: '10px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {difficultyData.map((d, index) => (
                                        <div key={d.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length] }}></span>
                                                <span className="text-zinc-500 font-medium">{d.name}</span>
                                            </div>
                                            <span className="font-semibold text-zinc-900">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Daily Study Time Chart */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={14} className="text-zinc-900" /> Daily Study Time
                    </h3>
                    <div className="h-44 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyStudyPattern} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', padding: '6px 10px' }}
                                    labelStyle={{ color: '#a1a1aa', fontSize: '9px', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                    formatter={(value) => [`${value} minutes`, 'Time Spent']}
                                />
                                <Bar dataKey="minutes" fill="#18181b" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Study Heatmap Grid */}
            <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm mb-8 overflow-x-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-zinc-900" /> Study Heatmap
                        </h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Visual representation of daily activities (problems solved, notes, focus sessions) over the last 16 weeks.</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-2 select-none min-w-[560px]">
                    {/* Days indicator */}
                    <div className="grid grid-rows-7 gap-1 text-[9px] text-zinc-400 font-semibold pt-4 pr-1">
                        <span>Su</span>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                    </div>

                    {/* Heatmap cells */}
                    <div className="flex-1 flex flex-col gap-1.5">
                        {heatmapGrid.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex gap-1.5">
                                {row.map((cell, colIndex) => {
                                    // Colors density
                                    let colorClass = 'bg-zinc-100 hover:bg-zinc-200';
                                    if (cell.count === 1) colorClass = 'bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/30';
                                    else if (cell.count === 2) colorClass = 'bg-indigo-300 hover:bg-indigo-400';
                                    else if (cell.count === 3) colorClass = 'bg-indigo-500 hover:bg-indigo-600';
                                    else if (cell.count >= 4) colorClass = 'bg-indigo-700 hover:bg-indigo-800';

                                    if (cell.isFuture) colorClass = 'bg-zinc-50/50 opacity-40 cursor-default';

                                    return (
                                        <div
                                            key={colIndex}
                                            className={`w-3.5 h-3.5 rounded transition-all duration-150 relative group cursor-pointer ${colorClass}`}
                                            title={`${cell.count} activities on ${cell.date.toDateString()}`}
                                        >
                                            {/* Hover tooltip overlay */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-zinc-950 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                {cell.count} activities on {cell.date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 text-[9px] font-semibold text-zinc-400 mt-3 pr-2">
                    <span>Less</span>
                    <span className="w-3.5 h-3.5 rounded bg-zinc-100"></span>
                    <span className="w-3.5 h-3.5 rounded bg-indigo-100"></span>
                    <span className="w-3.5 h-3.5 rounded bg-indigo-300"></span>
                    <span className="w-3.5 h-3.5 rounded bg-indigo-500"></span>
                    <span className="w-3.5 h-3.5 rounded bg-indigo-700"></span>
                    <span>More</span>
                </div>
            </div>

            {/* Bottom Grid: Activity Calendar + Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Activity Calendar Details */}
                <div className="lg:col-span-2 space-y-6">
                    <ActivityCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                    
                    {/* Daily activity lists based on selectedDate */}
                    <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-3">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Activities on {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </h3>
                            {dailyActivity.length > 0 && (
                                <span className="text-[10px] font-semibold bg-zinc-950 text-white px-2 py-0.5 rounded-full shadow-sm">
                                    {dailyActivity.length} subject{dailyActivity.length > 1 ? 's' : ''} active
                                </span>
                            )}
                        </div>

                        {loadingDaily ? (
                            <div className="flex justify-center py-10 animate-pulse"><div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-900 border-t-transparent"></div></div>
                        ) : dailyActivity.length === 0 ? (
                            <div className="text-center py-10 text-zinc-400 text-xs italic bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl">
                                No study logs or topics tracked on this day.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dailyActivity.map((activity, idx) => (
                                    <div key={idx} className="bg-zinc-50 border border-zinc-200/50 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl select-none">{activity.subjectIcon || '📚'}</span>
                                                    <div>
                                                        <span className="font-semibold text-xs text-zinc-800 block leading-tight">{activity.subjectName}</span>
                                                        <span className="text-[10px] text-zinc-400 font-medium">
                                                            {activity.topicsCompleted.length} / {activity.dailyTarget || 1} topics completed
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-1 rounded shadow-sm">
                                                    {activity.timeSpent}m
                                                </span>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="w-full bg-zinc-200/60 rounded-full h-1 mt-2 mb-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-zinc-950 rounded-full"
                                                    style={{ width: `${Math.min((activity.topicsCompleted.length / (activity.dailyTarget || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>

                                            {activity.topicsCompleted.length > 0 ? (
                                                <div className="space-y-1 mt-2 pt-2 border-t border-zinc-200/30">
                                                    {activity.topicsCompleted.map((topic, tIdx) => (
                                                        <div key={tIdx} className="text-[11px] text-zinc-600 flex items-center gap-1.5">
                                                            <CheckCircle size={10} className="text-emerald-500 shrink-0" />
                                                            <span className="truncate">{topic}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-zinc-400 italic">No topics marked complete yet.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Recent Activity Timeline */}
                <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm h-fit">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-zinc-100 flex items-center gap-1.5">
                        <Activity size={14} className="text-zinc-900" /> Recent Activity
                    </h3>
                    
                    {timelineActivities.length === 0 ? (
                        <div className="text-center py-10 text-zinc-400 text-xs italic bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl">
                            No recent activity found. Click Quick Add to start tracking.
                        </div>
                    ) : (
                        <div className="relative pl-4 border-l border-zinc-200/80 space-y-6">
                            {timelineActivities.map((act) => {
                                const ActIcon = act.icon;
                                return (
                                    <div key={act.id} className="relative font-sans text-xs">
                                        {/* Dot Indicator */}
                                        <div className="absolute left-[-22px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-zinc-950 flex items-center justify-center">
                                            <span className="w-1 h-1 rounded-full bg-zinc-950"></span>
                                        </div>
                                        
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-zinc-900 leading-tight">{act.title}</p>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">{act.subtitle}</p>
                                            </div>
                                            <span className="text-[9px] text-zinc-400 whitespace-nowrap">
                                                {act.timestamp.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        
                                        {/* Tags or metadata display */}
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${act.colorClass}`}>
                                                {act.type.toUpperCase().replace('_', ' ')}
                                            </span>
                                            {act.type === 'problem' && (
                                                <span className="text-[9px] text-zinc-400 italic">Attempts: {act.meta?.attempts || 1}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Add Command Palette Modal Dialog */}
            {isCommandPaletteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    
                    {/* Click backdrop to close */}
                    <div className="fixed inset-0" onClick={() => setIsCommandPaletteOpen(false)}></div>
                    
                    {/* Palette modal content */}
                    <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-lg rounded-xl overflow-hidden z-10 animate-scale-in">
                        
                        {/* Header search bar prefix */}
                        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm">
                                <Sparkles size={16} className="text-zinc-500" />
                                <span>Quick Actions Command Center</span>
                            </div>
                            <button onClick={() => setIsCommandPaletteOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Mode Menu / Selection Tab */}
                        {commandTab === 'menu' && (
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => setCommandTab('problem')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 text-left transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                            <Code size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-zinc-800">Track a Solved Problem</p>
                                            <p className="text-[10px] text-zinc-400">Instantly save solved coding tasks for practice metrics.</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={() => setCommandTab('note')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 text-left transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-zinc-800">Scribble / Quick Note</p>
                                            <p className="text-[10px] text-zinc-400">Save thoughts, quick explanations, or algorithms checklist.</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                                
                                <a
                                    href="/subjects"
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 text-left transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-zinc-100 text-zinc-700 rounded-lg border border-zinc-200">
                                            <BookOpen size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-zinc-800">Add a Study Subject</p>
                                            <p className="text-[10px] text-zinc-400">Configure study templates and tracks inside the subjects panel.</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                                </a>

                                <a
                                    href="/timer"
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 text-left transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-zinc-800">Start Pomodoro Session</p>
                                            <p className="text-[10px] text-zinc-400">Redirects to focus timer dashboard to log focus hours.</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                                </a>
                            </div>
                        )}

                        {/* Quick Add Problem Form */}
                        {commandTab === 'problem' && (
                            <form onSubmit={handleQuickProblemSubmit} className="p-5 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Quick Solved Problem Tracker</span>
                                    <button type="button" onClick={() => setCommandTab('menu')} className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 cursor-pointer">Back</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Platform</label>
                                        <select
                                            value={problemForm.platform}
                                            onChange={e => setProblemForm({ ...problemForm, platform: e.target.value })}
                                            className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800"
                                        >
                                            {['LeetCode', 'CodeForces', 'HackerRank', 'GeeksforGeeks', 'CodeChef', 'Custom'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Difficulty</label>
                                        <select
                                            value={problemForm.difficulty}
                                            onChange={e => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                                            className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800"
                                        >
                                            {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Problem Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Reverse Linked List"
                                        value={problemForm.title}
                                        onChange={e => setProblemForm({ ...problemForm, title: e.target.value })}
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">URL Link</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://leetcode.com/..."
                                        value={problemForm.url}
                                        onChange={e => setProblemForm({ ...problemForm, url: e.target.value })}
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tags (Comma Separated)</label>
                                    <input
                                        type="text"
                                        placeholder="linked-list, array, dsa"
                                        value={problemForm.tags}
                                        onChange={e => setProblemForm({ ...problemForm, tags: e.target.value })}
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-zinc-950 text-white text-xs font-semibold rounded hover:bg-zinc-800 shadow cursor-pointer">
                                        Add Solved Problem & Refresh
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Quick Add Note Form */}
                        {commandTab === 'note' && (
                            <form onSubmit={handleQuickNoteSubmit} className="p-5 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Write a Quick Scribble/Note</span>
                                    <button type="button" onClick={() => setCommandTab('menu')} className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 cursor-pointer">Back</button>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Note Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Graph BFS Traversal Concept"
                                        value={noteForm.title}
                                        onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Quick Content / Definition</label>
                                    <textarea
                                        required
                                        rows="3"
                                        placeholder="Wrote BFS algorithm structure: queues are utilized to track adjacent vertices in layer-by-layer order..."
                                        value={noteForm.content}
                                        onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tags (Comma Separated)</label>
                                    <input
                                        type="text"
                                        placeholder="algorithms, graphs, concepts"
                                        value={noteForm.tags}
                                        onChange={e => setNoteForm({ ...noteForm, tags: e.target.value })}
                                        className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-zinc-800 bg-zinc-50/50"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-zinc-950 text-white text-xs font-semibold rounded hover:bg-zinc-800 shadow cursor-pointer">
                                        Save Note & Refresh
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
