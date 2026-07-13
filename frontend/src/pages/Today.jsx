import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Calendar, BookOpen, Code, Book, Clock, Flame, Plus, RefreshCw, CheckCircle, 
    AlertCircle, Sparkles, ExternalLink, Play, Check, X, Tag, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { SubjectContext } from '../context/SubjectContext';
import noteService from '../context/noteService';
import problemService from '../context/problemService';
import sessionService from '../context/sessionService';
import topicService from '../context/topicService';
import SubjectForm from '../components/subjects/SubjectForm';

const Today = () => {
    const { user } = useContext(AuthContext);
    const { subjects, addSubject, fetchSubjects } = useContext(SubjectContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeSubjectTopics, setActiveSubjectTopics] = useState({});

    const [problems, setProblems] = useState([]);
    const [notes, setNotes] = useState([]);
    const [sessionStats, setSessionStats] = useState({ sessionsToday: 0, timeToday: 0 });
    
    const [plannedSessions, setPlannedSessions] = useState(() => {
        const saved = localStorage.getItem('plannedSessionsToday');
        return saved ? parseInt(saved, 10) : 4;
    });

    const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
    const [isAddProblemOpen, setIsAddProblemOpen] = useState(false);
    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

    const [problemForm, setProblemForm] = useState({
        title: '',
        url: '',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'Other',
        targetDate: new Date().toISOString().split('T')[0]
    });
    const [noteForm, setNoteForm] = useState({
        title: '',
        content: '',
        tags: '',
        isRevision: false
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const loadAllData = useCallback(async () => {
        try {
            setLoading(true);
            await fetchSubjects();

            const fetchedProblems = await problemService.getProblems();
            setProblems(fetchedProblems);

            let fetchedNotes = [];
            try {
                fetchedNotes = await noteService.getNotes({ isReviewed: false, reviewDue: true });
            } catch {
                console.warn('Backend query for review due failed, fetching all notes instead');
                const allNotes = await noteService.getNotes();
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                fetchedNotes = allNotes.filter(n => !n.isReviewed && n.nextReviewDate && new Date(n.nextReviewDate) <= todayEnd);
            }
            setNotes(fetchedNotes);

            const stats = await sessionService.getStats();
            setSessionStats(stats);
        } catch (error) {
            console.error('Error loading Today workspace data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchSubjects]);

    useEffect(() => {
        if (user) {
            loadAllData();
        }
    }, [user, loadAllData]);

    const adjustPlannedSessions = (amount) => {
        setPlannedSessions(prev => {
            const next = Math.max(1, prev + amount);
            localStorage.setItem('plannedSessionsToday', next.toString());
            return next;
        });
    };

    useEffect(() => {
        const fetchActiveTopics = async () => {
            const active = subjects.filter(sub => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const start = new Date(sub.startDate);
                start.setHours(0,0,0,0);
                const end = new Date(sub.endDate);
                end.setHours(23,59,59,999);
                return today >= start && today <= end;
            });

            const topicsData = {};
            for (const sub of active) {
                try {
                    const topicsList = await topicService.getTopics(sub._id);
                    topicsList.sort((a, b) => a.dayNumber - b.dayNumber);

                    const currentTopic = topicsList.find(t => !['completed', 'mastered'].includes(t.status));
                    const remainingCount = topicsList.filter(t => !['completed', 'mastered'].includes(t.status)).length;

                    topicsData[sub._id] = {
                        currentTopic: currentTopic ? currentTopic.name : 'All Completed! 🎉',
                        remainingCount
                    };
                } catch {
                    console.error(`Failed to load topics for subject ${sub._id}`);
                    topicsData[sub._id] = {
                        currentTopic: 'Error loading topic',
                        remainingCount: 0
                    };
                }
            }
            setActiveSubjectTopics(topicsData);
        };

        if (subjects.length > 0) {
            fetchActiveTopics();
        }
    }, [subjects]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadAllData();
    };

    
    const handleAddSubjectSubmit = async (formData) => {
        try {
            await addSubject(formData);
            setIsAddSubjectOpen(false);
            loadAllData();
        } catch {
            alert('Failed to add subject');
        }
    };

    const handleAddProblemSubmit = async (e) => {
        e.preventDefault();
        try {
            await problemService.createProblem({
                ...problemForm,
                status: 'planned'
            });
            setIsAddProblemOpen(false);
            setProblemForm({
                title: '',
                url: '',
                platform: 'LeetCode',
                difficulty: 'Medium',
                category: 'Other',
                targetDate: new Date().toISOString().split('T')[0]
            });
            loadAllData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add coding problem');
        }
    };

    const handleAddNoteSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...noteForm,
                tags: noteForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                isReviewed: false
            };
            await noteService.createNote(payload);
            setIsAddNoteOpen(false);
            setNoteForm({
                title: '',
                content: '',
                tags: '',
                isRevision: false
            });
            loadAllData();
        } catch {
            alert('Failed to create study note');
        }
    };

    const [isSyncing, setIsSyncing] = useState(false);
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await problemService.syncPlatforms();
            alert('Platform metrics successfully synced!');
            loadAllData();
        } catch {
            alert('Failed to sync. Please verify connected usernames in settings.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMarkProblemSolved = async (id) => {
        try {
            await problemService.updateProblem(id, { status: 'solved' });
            loadAllData();
        } catch {
            alert('Failed to update problem status');
        }
    };

    const handleMarkNoteReviewed = async (id) => {
        try {
            await noteService.updateNote(id, { isReviewed: true });
            loadAllData();
        } catch {
            alert('Failed to mark note as reviewed');
        }
    };

    
    const activeSubjects = subjects.filter(sub => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const start = new Date(sub.startDate);
        start.setHours(0,0,0,0);
        const end = new Date(sub.endDate);
        end.setHours(23,59,59,999);
        return today >= start && today <= end;
    });

    const practiceQueueToday = problems.filter(p => {
        if (!p.targetDate) return false;
        return new Date(p.targetDate).toDateString() === new Date().toDateString();
    });

    const isCodingGoalCompleted = problems.some(p => {
        if (p.status !== 'solved' || !p.solvedAt) return false;
        return new Date(p.solvedAt).toDateString() === new Date().toDateString();
    });

    const topicsMinutes = activeSubjects.reduce((sum, s) => sum + (s.dailyTarget || 2) * 30, 0);

    const DIFFICULTY_MINS = { Easy: 30, Medium: 45, Hard: 75 };
    const practiceMinutes = practiceQueueToday
        .filter(p => p.status !== 'solved')
        .reduce((sum, p) => sum + (DIFFICULTY_MINS[p.difficulty] ?? 30), 0);

    const notesMinutes = notes.length * 15;

    const sessionsMinutes = plannedSessions * 25;

    const estimatedMinutes = topicsMinutes + practiceMinutes + notesMinutes + sessionsMinutes;
                            
    const formatEstimatedTime = (totalMins) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    const getMotivationalMessage = () => {
        if (sessionStats.sessionsToday > 0 && isCodingGoalCompleted) {
            return "Fantastic job! You've completed focus sessions and hit your coding goal today. Finish up outstanding reviews!";
        }
        if (isCodingGoalCompleted) {
            return "Coding goal locked in for today! Take a quick break, then start a focus timer block to keep going.";
        }
        if (sessionStats.sessionsToday > 0) {
            return "Focus block logged! Now complete a practice problem to save your daily coding goal.";
        }
        return "Let's make today count. Start by knocking out one of your practice problems or starting a focus timer.";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-950 mb-4"></div>
                <p className="text-sm text-zinc-500 font-medium">Preparing your daily workspace...</p>
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans text-zinc-800 bg-white min-h-screen">
            <div className="flex justify-between items-center mb-8 pb-5 border-b border-zinc-200/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-950 text-white rounded-xl shadow-sm border border-zinc-900">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Daily Workspace</h1>
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mt-0.5">Command Center</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 border border-zinc-200/60 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Refresh Data"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Sync Dashboard</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-8">
                    
                    <div className="relative rounded-2xl bg-zinc-950 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-zinc-900">
                        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-zinc-800/40 blur-3xl"></div>
                        <div className="absolute bottom-[-30px] left-[20%] w-36 h-36 rounded-full bg-zinc-900/60 blur-2xl"></div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800/40">Workspace Hero</span>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">{getGreeting()}, {user?.name || 'Scholar'}</h2>
                                </div>
                                <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    <Flame size={14} className="text-orange-500 fill-orange-500 animate-pulse" />
                                    <span className="text-xs font-bold text-zinc-150">{user?.currentStreak || 0} Day Streak</span>
                                </div>
                            </div>

                            <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl italic">
                                "{getMotivationalMessage()}"
                            </p>

                            <div className="border-t border-zinc-850 pt-5 mt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-zinc-900/60 border border-zinc-850/50 p-3.5 rounded-xl">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Practice Due</p>
                                        <p className="text-xl font-bold mt-1 text-zinc-100">{practiceQueueToday.filter(p => p.status !== 'solved').length} items</p>
                                    </div>
                                    <div className="bg-zinc-900/60 border border-zinc-850/50 p-3.5 rounded-xl">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Subjects</p>
                                        <p className="text-xl font-bold mt-1 text-zinc-100">{activeSubjects.length} courses</p>
                                    </div>
                                    <div className="bg-zinc-900/60 border border-zinc-850/50 p-3.5 rounded-xl">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Notes Due</p>
                                        <p className="text-xl font-bold mt-1 text-zinc-100">{notes.length} reviews</p>
                                    </div>
                                    <div className="bg-zinc-900/60 border border-zinc-850/50 p-3.5 rounded-xl">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Study Budget</p>
                                        <p className="text-xl font-bold mt-1 text-zinc-100">{formatEstimatedTime(estimatedMinutes)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm tracking-tight text-zinc-900 uppercase select-none flex items-center gap-2">
                                <BookOpen size={16} className="text-zinc-400" /> Active Subjects Today ({activeSubjects.length})
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">ONGOING TARGETS</span>
                        </div>

                        {activeSubjects.length === 0 ? (
                            <div className="bg-zinc-50/50 rounded-xl border border-zinc-200/50 p-8 text-center select-none font-sans text-xs">
                                <p className="text-zinc-500 font-medium">No active subjects scheduled for today.</p>
                                <button 
                                    onClick={() => setIsAddSubjectOpen(true)}
                                    className="text-zinc-900 font-bold mt-2 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                >
                                    Add your first subject &rarr;
                                </button>
                            </div>
                        ) : (() => {
                            const needsAttention = activeSubjects
                                .filter(sub => {
                                    const topicInfo = activeSubjectTopics[sub._id];
                                    if (!topicInfo) return true;
                                    return topicInfo.remainingCount > 0;
                                })
                                .sort((a, b) => {
                                    const daysA = Math.max(0, Math.ceil((new Date(a.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                                    const daysB = Math.max(0, Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                                    if (daysA !== daysB) return daysA - daysB;
                                    const remA = activeSubjectTopics[a._id]?.remainingCount ?? 0;
                                    const remB = activeSubjectTopics[b._id]?.remainingCount ?? 0;
                                    if (remB !== remA) return remB - remA;
                                    return (a.progressPercentage || 0) - (b.progressPercentage || 0);
                                });

                            const completedToday = activeSubjects.filter(sub => {
                                const topicInfo = activeSubjectTopics[sub._id];
                                return topicInfo && topicInfo.remainingCount === 0;
                            });

                            const SubjectCard = ({ sub, isCompleted }) => {
                                const progress = sub.progressPercentage || 0;
                                const topicInfo = activeSubjectTopics[sub._id] || { currentTopic: 'Loading topic...', remainingCount: 0 };
                                const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)));

                                return (
                                    <div className={`bg-white border rounded-xl p-5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                                        isCompleted
                                            ? 'border-emerald-200/70 bg-emerald-50/20 hover:border-emerald-300 hover:shadow-sm'
                                            : 'border-zinc-200/60 hover:border-zinc-350 hover:shadow-sm'
                                    }`}>
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl select-none" style={{ color: sub.color }}>{sub.icon || '📚'}</span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-zinc-950">{sub.name}</h4>
                                                        {isCompleted && (
                                                            <span className="text-[9px] font-bold tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full select-none">
                                                                Today's Goal Completed 🎉
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-zinc-400 font-bold tracking-wide uppercase">{sub.dailyTarget} topics / day</p>
                                                </div>
                                            </div>

                                            <div className="max-w-md">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%`, backgroundColor: sub.color || '#18181b' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 border-t md:border-t-0 border-zinc-150/60 pt-3 md:pt-0">
                                            <div className="text-xs">
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider select-none">Current Topic</p>
                                                <p className="font-bold text-zinc-800 truncate max-w-[150px] mt-0.5">{topicInfo.currentTopic}</p>
                                            </div>
                                            <div className="text-xs">
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider select-none">Remaining</p>
                                                <p className="font-bold text-zinc-800 mt-0.5">{topicInfo.remainingCount} topics</p>
                                            </div>
                                            <div className="text-xs">
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider select-none">Timeline</p>
                                                <p className="font-bold text-zinc-800 mt-0.5">{daysLeft} days left</p>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/subjects/${sub._id}`)}
                                                className={`col-span-2 md:col-span-1 flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer select-none ${
                                                    isCompleted
                                                        ? 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                                                        : 'border border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white'
                                                }`}
                                            >
                                                <span>{isCompleted ? 'Review Subject' : 'Learn'}</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            };

                            return (
                                <div className="space-y-6">
                                    {needsAttention.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">🔥 Needs Attention</span>
                                                <span className="text-[9px] font-bold bg-rose-50 text-rose-500 border border-rose-200/70 px-2 py-0.5 rounded-full">{needsAttention.length}</span>
                                            </div>
                                            <div className="space-y-3">
                                                {needsAttention.map(sub => <SubjectCard key={sub._id} sub={sub} isCompleted={false} />)}
                                            </div>
                                        </div>
                                    )}

                                    {completedToday.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">✅ Completed Today</span>
                                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/70 px-2 py-0.5 rounded-full">{completedToday.length}</span>
                                            </div>
                                            <div className="space-y-3">
                                                {completedToday.map(sub => <SubjectCard key={sub._id} sub={sub} isCompleted={true} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm tracking-tight text-zinc-900 uppercase select-none flex items-center gap-2">
                                <Code size={16} className="text-zinc-400" /> Today's Practice ({practiceQueueToday.length})
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">PRACTICE QUEUE</span>
                        </div>

                        {practiceQueueToday.length === 0 ? (
                            <div className="bg-zinc-50/50 rounded-xl border border-zinc-200/50 p-8 text-center select-none font-sans text-xs">
                                <p className="text-zinc-500 font-medium">No practice problems due for today.</p>
                                <button 
                                    onClick={() => setIsAddProblemOpen(true)}
                                    className="text-zinc-900 font-bold mt-2 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                >
                                    Add a problem now &rarr;
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {practiceQueueToday.map((prob) => {
                                    const difficultyColor = 
                                        prob.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-250/55' :
                                        prob.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-250/55' :
                                        'bg-rose-50 text-rose-700 border-rose-250/55';

                                    const isSolved = prob.status === 'solved';

                                    return (
                                        <div 
                                            key={prob._id}
                                            className={`bg-white border rounded-xl p-4 transition-all duration-150 flex items-center justify-between gap-4 hover:shadow-sm ${
                                                isSolved ? 'border-zinc-200 opacity-60' : 'border-zinc-200/70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg border ${
                                                    isSolved ? 'bg-zinc-100 text-zinc-450 border-zinc-200' : 'bg-zinc-50 text-zinc-700 border-zinc-200/60'
                                                }`}>
                                                    <Code size={16} />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs font-semibold text-zinc-950 ${isSolved ? 'line-through' : ''}`}>
                                                        {prob.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1 select-none">
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{prob.platform}</span>
                                                        <span className="text-[8px] text-zinc-300">•</span>
                                                        <span className={`text-[9px] font-semibold border px-1.5 py-0.2 rounded ${difficultyColor}`}>
                                                            {prob.difficulty}
                                                        </span>
                                                        {prob.category && prob.category !== 'Other' && (
                                                            <>
                                                                <span className="text-[8px] text-zinc-300">•</span>
                                                                <span className="text-[9px] text-zinc-400 font-medium">{prob.category}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                {isSolved ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-2">
                                                        <CheckCircle size={14} className="text-zinc-650" /> Solved
                                                    </span>
                                                ) : (
                                                    <>
                                                        <a 
                                                            href={prob.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 bg-zinc-950 text-white hover:bg-zinc-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                                                        >
                                                            <span>Solve Now</span>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                        <button
                                                            onClick={() => handleMarkProblemSolved(prob._id)}
                                                            className="p-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-zinc-450 hover:text-zinc-900 transition-all cursor-pointer shadow-sm"
                                                            title="Mark as Solved"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    
                    <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider select-none">Quick Actions</h4>
                        <div className="flex flex-col gap-2.5">
                            <button 
                                onClick={() => setIsAddSubjectOpen(true)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 hover:border-zinc-350 text-xs font-semibold text-zinc-800 transition-all cursor-pointer select-none"
                            >
                                <span className="flex items-center gap-2"><BookOpen size={14} className="text-zinc-400" /> Add Subject</span>
                                <Plus size={14} className="text-zinc-400" />
                            </button>
                            <button 
                                onClick={() => setIsAddProblemOpen(true)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 hover:border-zinc-350 text-xs font-semibold text-zinc-800 transition-all cursor-pointer select-none"
                            >
                                <span className="flex items-center gap-2"><Code size={14} className="text-zinc-400" /> Add to Practice Queue</span>
                                <Plus size={14} className="text-zinc-400" />
                            </button>
                            <button 
                                onClick={() => setIsAddNoteOpen(true)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 hover:border-zinc-350 text-xs font-semibold text-zinc-800 transition-all cursor-pointer select-none"
                            >
                                <span className="flex items-center gap-2"><Book size={14} className="text-zinc-400" /> Create Note</span>
                                <Plus size={14} className="text-zinc-400" />
                            </button>
                            <button 
                                onClick={() => navigate('/timer')}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 hover:border-zinc-350 text-xs font-semibold text-zinc-800 transition-all cursor-pointer select-none"
                            >
                                <span className="flex items-center gap-2"><Clock size={14} className="text-zinc-400" /> Start Focus Session</span>
                                <Play size={12} className="text-zinc-400 fill-zinc-400" />
                            </button>
                            <button 
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 hover:border-zinc-350 text-xs font-semibold text-zinc-800 transition-all cursor-pointer disabled:opacity-50 select-none"
                            >
                                <span className="flex items-center gap-2"><RefreshCw size={14} className={`text-zinc-400 ${isSyncing ? "animate-spin" : ""}`} /> Sync Platforms</span>
                                <ChevronRight size={14} className="text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                            <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider select-none flex items-center gap-1.5">
                                <Clock size={14} className="text-zinc-500" /> Today's Focus
                            </h4>
                            <div className="flex items-center gap-2 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-250/20 select-none">
                                <button 
                                    onClick={() => adjustPlannedSessions(-1)}
                                    className="text-xs font-black text-zinc-400 hover:text-zinc-800 px-1 cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="text-[10px] font-bold text-zinc-650">{plannedSessions} Target</span>
                                <button 
                                    onClick={() => adjustPlannedSessions(1)}
                                    className="text-xs font-black text-zinc-400 hover:text-zinc-800 px-1 cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <p className="text-xs font-medium text-zinc-500">Interval Blocks</p>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-zinc-950">{sessionStats.sessionsToday}</span>
                                    <span className="text-xs font-semibold text-zinc-450"> / {plannedSessions} completed</span>
                                </div>
                            </div>

                            <div className="flex gap-2.5 select-none">
                                {[...Array(plannedSessions)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                                            i < sessionStats.sessionsToday
                                                ? 'bg-zinc-950 border border-zinc-950'
                                                : 'bg-zinc-50 border border-zinc-250/40'
                                        }`}
                                    />
                                ))}
                            </div>

                            <p className="text-[10px] text-zinc-400 font-medium">
                                Total focus study time today: <strong>{Math.floor(sessionStats.timeToday)} minutes</strong>
                            </p>

                            <button
                                onClick={() => navigate('/timer')}
                                className="w-full flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer select-none"
                            >
                                <Play size={14} fill="currentColor" />
                                <span>Start Focus</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider select-none flex items-center gap-1.5">
                            <Flame size={14} className="text-orange-500" /> Daily Goals & Streak
                        </h4>

                        <div className="space-y-3.5">
                            <div className="flex items-center gap-3 bg-orange-50/60 border border-orange-100 p-3 rounded-xl">
                                <div className="p-2 bg-orange-500 text-white rounded-lg select-none">
                                    <Flame size={18} className="fill-orange-500 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-orange-650 font-bold uppercase tracking-wider select-none">Current Streak</p>
                                    <p className="text-lg font-bold text-orange-850 mt-0.5">{user?.currentStreak || 0} consecutive days</p>
                                </div>
                            </div>

                            {isCodingGoalCompleted ? (
                                <div className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-xl">
                                    <CheckCircle size={16} className="text-emerald-650 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h5 className="text-xs font-bold text-emerald-850">Coding Goal Completed</h5>
                                        <p className="text-[10px] text-emerald-600 mt-1 leading-relaxed">
                                            You've solved a problem today! Your streak is secured.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 bg-rose-50/60 border border-rose-100 p-3.5 rounded-xl">
                                    <AlertCircle size={16} className="text-rose-650 mt-0.5 flex-shrink-0 animate-pulse" />
                                    <div>
                                        <h5 className="text-xs font-bold text-rose-850">Streak at Risk!</h5>
                                        <p className="text-[10px] text-rose-600 mt-1 leading-relaxed">
                                            Solve at least one coding problem today to complete your daily goal and extend your streak!
                                        </p>
                                        <button 
                                            onClick={() => setIsAddProblemOpen(true)}
                                            className="text-[10px] font-bold text-rose-900 hover:underline mt-2 cursor-pointer flex items-center gap-0.5"
                                        >
                                            Add and solve a problem &rarr;
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider select-none flex items-center gap-1.5">
                                <Book size={14} className="text-zinc-500" /> Notes to Review
                            </h4>
                            <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">{notes.length} due</span>
                        </div>

                        {notes.length === 0 ? (
                            <div className="bg-zinc-50/50 rounded-xl border border-zinc-200/50 p-6 text-center select-none font-sans text-xs">
                                <p className="text-zinc-500 font-medium">All caught up! No notes due for review today.</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                                {notes.map((note) => (
                                    <div 
                                        key={note._id}
                                        className="bg-white border border-zinc-200/70 p-3.5 rounded-xl space-y-2.5 hover:border-zinc-350 transition-all"
                                    >
                                        <div>
                                            <h5 className="text-xs font-bold text-zinc-950 truncate">{note.title}</h5>
                                            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                                                {note.content}
                                            </p>
                                        </div>

                                        {note.tags && note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {note.tags.map(t => (
                                                    <span key={t} className="text-[8px] font-semibold text-zinc-455 border border-zinc-200/60 px-1.5 py-0.2 rounded-md">
                                                        #{t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-1 border-t border-zinc-100">
                                            <button
                                                onClick={() => handleMarkNoteReviewed(note._id)}
                                                className="flex items-center gap-1 text-[10px] font-bold text-zinc-900 hover:text-black hover:underline cursor-pointer select-none"
                                            >
                                                <Check size={11} />
                                                <span>Mark Reviewed</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <SubjectForm 
                isOpen={isAddSubjectOpen}
                onClose={() => setIsAddSubjectOpen(false)}
                onSubmit={handleAddSubjectSubmit}
            />

            {isAddProblemOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md border border-zinc-250/50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wide select-none">Add to Practice Queue</h3>
                            <button onClick={() => setIsAddProblemOpen(false)} className="p-1 hover:bg-zinc-100 rounded-full cursor-pointer text-zinc-450 hover:text-zinc-800">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddProblemSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Problem Title *</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Reverse Linked List II"
                                    value={problemForm.title}
                                    onChange={e => setProblemForm({...problemForm, title: e.target.value})}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 outline-none focus:border-zinc-850 text-zinc-800 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Problem URL *</label>
                                <input 
                                    type="url" 
                                    required 
                                    placeholder="e.g. https://leetcode.com/problems/reverse-linked-list"
                                    value={problemForm.url}
                                    onChange={e => setProblemForm({...problemForm, url: e.target.value})}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 outline-none focus:border-zinc-850 text-zinc-800 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Platform *</label>
                                    <select 
                                        value={problemForm.platform}
                                        onChange={e => setProblemForm({...problemForm, platform: e.target.value})}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 bg-white outline-none focus:border-zinc-850 text-zinc-800 font-semibold cursor-pointer"
                                    >
                                        <option value="LeetCode">LeetCode</option>
                                        <option value="Codeforces">Codeforces</option>
                                        <option value="HackerRank">HackerRank</option>
                                        <option value="GeeksforGeeks">GeeksforGeeks</option>
                                        <option value="CodeChef">CodeChef</option>
                                        <option value="AtCoder">AtCoder</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Difficulty *</label>
                                    <select 
                                        value={problemForm.difficulty}
                                        onChange={e => setProblemForm({...problemForm, difficulty: e.target.value})}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 bg-white outline-none focus:border-zinc-850 text-zinc-800 font-semibold cursor-pointer"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                                    <select 
                                        value={problemForm.category}
                                        onChange={e => setProblemForm({...problemForm, category: e.target.value})}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 bg-white outline-none focus:border-zinc-850 text-zinc-800 font-semibold cursor-pointer"
                                    >
                                        <option value="Other">Other</option>
                                        <option value="Array">Array</option>
                                        <option value="String">String</option>
                                        <option value="Tree">Tree</option>
                                        <option value="Graph">Graph</option>
                                        <option value="DP">DP</option>
                                        <option value="Greedy">Greedy</option>
                                        <option value="Linked List">Linked List</option>
                                        <option value="Stack">Stack</option>
                                        <option value="Queue">Queue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Date</label>
                                    <input 
                                        type="date"
                                        value={problemForm.targetDate}
                                        onChange={e => setProblemForm({...problemForm, targetDate: e.target.value})}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 outline-none focus:border-zinc-850 text-zinc-800 font-semibold cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddProblemOpen(false)}
                                    className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-550 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                                >
                                    Add Problem
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddNoteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg border border-zinc-250/50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wide select-none">Create Note Scribble</h3>
                            <button onClick={() => setIsAddNoteOpen(false)} className="p-1 hover:bg-zinc-100 rounded-full cursor-pointer text-zinc-455 hover:text-zinc-800">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddNoteSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Title *</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Master Theorem formula"
                                    value={noteForm.title}
                                    onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 outline-none focus:border-zinc-850 text-zinc-800 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Content *</label>
                                <textarea 
                                    required 
                                    rows="4"
                                    placeholder="Write your study logs, formula, definitions or code snippets here..."
                                    value={noteForm.content}
                                    onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-250/70 outline-none focus:border-zinc-850 text-zinc-800 font-medium resize-none leading-relaxed"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Tags (separated by comma)</label>
                                <div className="relative flex items-center">
                                    <Tag size={12} className="absolute left-3 text-zinc-400" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. math, recursion, revision"
                                        value={noteForm.tags}
                                        onChange={e => setNoteForm({...noteForm, tags: e.target.value})}
                                        className="w-full text-xs pl-8 pr-3.5 py-2.5 rounded-lg border border-zinc-250/70 outline-none focus:border-zinc-850 text-zinc-800 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-1 select-none">
                                <input 
                                    type="checkbox" 
                                    id="isRevision" 
                                    checked={noteForm.isRevision}
                                    onChange={e => setNoteForm({...noteForm, isRevision: e.target.checked})}
                                    className="w-3.5 h-3.5 border border-zinc-300 rounded focus:ring-0 text-zinc-950 accent-zinc-950 cursor-pointer"
                                />
                                <label htmlFor="isRevision" className="text-xs text-zinc-650 font-semibold cursor-pointer">
                                    Include note in Revision List (marked as revision)
                                </label>
                            </div>

                            <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddNoteOpen(false)}
                                    className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-550 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                                >
                                    Save Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Today;
