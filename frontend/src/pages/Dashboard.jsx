import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import dashboardService from '../context/dashboardService';
import problemService from '../context/problemService';
import noteService from '../context/noteService';
import sessionService from '../context/sessionService';
import subjectService from '../context/subjectService';
import {
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    Clock, BookOpen, CheckCircle, Flame, RefreshCw,
    Activity, Code, Brain, Calendar, Sparkles, ChevronRight, X, ArrowRight,
    TrendingUp, Award, CheckCircle2, ChevronLeft, Calendar as CalendarIcon, Info
} from 'lucide-react';
import ActivityCalendar from '../components/dashboard/ActivityCalendar';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [problems, setProblems] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [notes, setNotes] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);

    const [timeframe, setTimeframe] = useState('week');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [heatmapHoverData, setHeatmapHoverData] = useState(null);

    const cardShell = "bg-white border border-zinc-200/70 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_18px_44px_-24px_rgba(24,24,27,0.35)]";
    const sectionShell = "bg-gradient-to-br from-white via-zinc-50/60 to-zinc-100/40 border border-zinc-200/70 rounded-2xl shadow-sm";

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [stats, problemsData, sessionsData, notesData, subjectsData] = await Promise.all([
                dashboardService.getStats(),
                problemService.getProblems({}),
                sessionService.getSessions(120, 150),
                noteService.getNotes({}),
                subjectService.getSubjects()
            ]);
            setData(stats);
            setProblems(problemsData);
            setSessions(sessionsData);
            setNotes(notesData);
            setSubjectsList(subjectsData);
        } catch (error) {
            console.error("Failed to fetch dashboard analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    const dailySummary = useMemo(() => {
        if (!selectedDate) return null;
        const targetStr = selectedDate.toDateString();
        const solvedProblems = problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt).toDateString() === targetStr);
        const studySessionsToday = sessions.filter(s => s.completed && new Date(s.createdAt).toDateString() === targetStr);
        const focusMinutes = studySessionsToday.reduce((sum, s) => sum + s.actualTime, 0);
        const completedTopicsCount = studySessionsToday.filter(s => s.topic).length;
        const notesReviewed = notes.filter(n => n.isReviewed && n.updatedAt && new Date(n.updatedAt).toDateString() === targetStr);
        const notesCreated = notes.filter(n => n.createdAt && new Date(n.createdAt).toDateString() === targetStr);
        const achievementsUnlocked = [];
        if (solvedProblems.length >= 3) achievementsUnlocked.push('Problem Crusher');
        if (focusMinutes >= 90) achievementsUnlocked.push('Focus Master');
        const subjectsWorked = Array.from(new Set(studySessionsToday.map(s => s.subject?.name).filter(Boolean)));
        return {
            date: selectedDate,
            problemsSolved: solvedProblems.length,
            solvedList: solvedProblems,
            studyTime: focusMinutes,
            sessionsCount: studySessionsToday.length,
            topicsCompleted: completedTopicsCount,
            notesReviewed: notesReviewed.length,
            notesCreated: notesCreated.length,
            subjectsWorkedOn: subjectsWorked,
            achievements: achievementsUnlocked
        };
    }, [selectedDate, problems, sessions, notes]);

    const todayStats = useMemo(() => {
        if (!dailySummary) return { todayProgressPercentage: 0, remainingStudyTime: 120 };
        const problemsRatio = Math.min(1, dailySummary.problemsSolved / 3);
        const timeRatio = Math.min(1, dailySummary.studyTime / 90);
        const topicsRatio = Math.min(1, dailySummary.topicsCompleted / 2);
        const notesRatio = Math.min(1, dailySummary.notesReviewed / 2);
        const pct = Math.round(((problemsRatio + timeRatio + topicsRatio + notesRatio) / 4) * 100);
        
        const studyBudget = 120;
        const remaining = Math.max(0, studyBudget - dailySummary.studyTime);
        return { todayProgressPercentage: pct, remainingStudyTime: remaining };
    }, [dailySummary]);

    const formatTime = useCallback((mins) => {
        if (mins <= 0) return '0m';
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        if (hrs > 0) {
            return `${hrs}h ${m}m`;
        }
        return `${m}m`;
    }, []);

    const getDailyInsight = useCallback(() => {
        if (!dailySummary) return "Start your first study session of the day to build momentum!";
        const pct = todayStats.todayProgressPercentage;
        if (pct === 100) {
            return "Outstanding! You've achieved 100% of today's targets. Excellent consistency today! 🎉";
        }
        if (dailySummary.problemsSolved > 0 && dailySummary.problemsSolved < 3) {
            const left = 3 - dailySummary.problemsSolved;
            return `Finish ${left} remaining practice problem${left > 1 ? 's' : ''} to complete today's coding goals.`;
        }
        if (todayStats.remainingStudyTime > 0) {
            return `You still have ${formatTime(todayStats.remainingStudyTime)} of planned study time remaining. Keep pushing!`;
        }
        if (pct >= 50) {
            return `You're ${pct}% through today's study plan. Great progress!`;
        }
        return "Start your first study session of the day to build momentum!";
    }, [dailySummary, todayStats.todayProgressPercentage, todayStats.remainingStudyTime, formatTime]);

    const statsSummary = useMemo(() => {
        if (!data || problems.length === 0) return null;
        const getDaysAgo = (num) => { const d = new Date(); d.setDate(d.getDate() - num); return d; };
        const todayStr = new Date().toDateString();
        const totalSolved = problems.filter(p => p.status === 'solved').length;
        const solvedToday = problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt).toDateString() === todayStr).length;
        const solvedLast7 = problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt) >= getDaysAgo(7)).length;
        const solvedPrev7 = problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt) < getDaysAgo(7) && new Date(p.solvedAt) >= getDaysAgo(14)).length;
        const solvedTrend = solvedPrev7 > 0 ? Math.round(((solvedLast7 - solvedPrev7) / solvedPrev7) * 100) : solvedLast7 * 100;
        const totalFocusMins = sessions.filter(s => s.completed).reduce((sum, s) => sum + s.actualTime, 0);
        const focusHours = (totalFocusMins / 60).toFixed(1);
        const focusLast7 = sessions.filter(s => s.completed && new Date(s.createdAt) >= getDaysAgo(7)).reduce((sum, s) => sum + s.actualTime, 0);
        const focusPrev7 = sessions.filter(s => s.completed && new Date(s.createdAt) < getDaysAgo(7) && new Date(s.createdAt) >= getDaysAgo(14)).reduce((sum, s) => sum + s.actualTime, 0);
        const focusTrend = focusPrev7 > 0 ? Math.round(((focusLast7 - focusPrev7) / focusPrev7) * 100) : focusLast7 * 100;
        const completionRate = problems.length > 0 ? Math.round((totalSolved / problems.length) * 100) : 0;
        const completedTopics = subjectsList.reduce((sum, s) => sum + (s.completedTopics || 0), 0);
        return { totalSolved, solvedToday, solvedTrend, focusHours, focusLast7Hours: (focusLast7 / 60).toFixed(1), focusTrend, completionRate, completedTopics };
    }, [data, problems, sessions, subjectsList]);

    const heatmapData = useMemo(() => {
        const grid = [];
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - (16 * 7));
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const tempDate = new Date(startDate);
        while (tempDate <= today) {
            const dateStr = tempDate.toDateString();
            const solvedCount = problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt).toDateString() === dateStr).length;
            const studySessions = sessions.filter(s => s.completed && new Date(s.createdAt).toDateString() === dateStr);
            const studyMins = studySessions.reduce((sum, s) => sum + s.actualTime, 0);
            const topicsCount = studySessions.filter(s => s.topic).length;
            const notesRev = notes.filter(n => n.isReviewed && n.updatedAt && new Date(n.updatedAt).toDateString() === dateStr).length;
            const totalScore = (solvedCount * 4) + (studyMins / 15) + (topicsCount * 3) + (notesRev * 2);
            let level = 0;
            if (totalScore > 0 && totalScore <= 3) level = 1;
            else if (totalScore > 3 && totalScore <= 8) level = 2;
            else if (totalScore > 8 && totalScore <= 15) level = 3;
            else if (totalScore > 15) level = 4;
            grid.push({ date: new Date(tempDate), level, problemsSolved: solvedCount, studyTime: studyMins, topicsCompleted: topicsCount, notesReviewed: notesRev, sessionsCount: studySessions.length });
            tempDate.setDate(tempDate.getDate() + 1);
        }
        return grid;
    }, [problems, sessions, notes]);

    const heatmapWeeks = useMemo(() => {
        const weeks = [];
        let currentWeek = [];
        heatmapData.forEach((day, index) => {
            currentWeek.push(day);
            if (currentWeek.length === 7 || index === heatmapData.length - 1) { weeks.push(currentWeek); currentWeek = []; }
        });
        return weeks;
    }, [heatmapData]);

    const chartData = useMemo(() => {
        const result = [];
        const today = new Date();
        if (timeframe === 'week') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(); date.setDate(date.getDate() - i);
                const dStr = date.toDateString();
                result.push({
                    name: date.toLocaleDateString('default', { weekday: 'short' }),
                    dateLabel: date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
                    problemsSolved: problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt).toDateString() === dStr).length,
                    studyTime: sessions.filter(s => s.completed && new Date(s.createdAt).toDateString() === dStr).reduce((sum, s) => sum + s.actualTime, 0),
                    focusSessions: sessions.filter(s => s.completed && new Date(s.createdAt).toDateString() === dStr).length
                });
            }
        } else if (timeframe === 'month') {
            for (let i = 3; i >= 0; i--) {
                const start = new Date(); start.setDate(today.getDate() - ((i + 1) * 7));
                const end = new Date(); end.setDate(today.getDate() - (i * 7));
                result.push({
                    name: `Wk -${i}`,
                    dateLabel: `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { day: 'numeric' })}`,
                    problemsSolved: problems.filter(p => p.status === 'solved' && p.solvedAt && new Date(p.solvedAt) >= start && new Date(p.solvedAt) <= end).length,
                    studyTime: Math.round(sessions.filter(s => s.completed && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end).reduce((sum, s) => sum + s.actualTime, 0)),
                    focusSessions: sessions.filter(s => s.completed && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end).length
                });
            }
        } else {
            for (let i = 5; i >= 0; i--) {
                const date = new Date(); date.setMonth(today.getMonth() - i);
                const monthNum = date.getMonth(); const yearNum = date.getFullYear();
                result.push({
                    name: date.toLocaleDateString('default', { month: 'short' }),
                    dateLabel: date.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
                    problemsSolved: problems.filter(p => { if (p.status !== 'solved' || !p.solvedAt) return false; const d = new Date(p.solvedAt); return d.getMonth() === monthNum && d.getFullYear() === yearNum; }).length,
                    studyTime: Math.round(sessions.filter(s => { if (!s.completed) return false; const d = new Date(s.createdAt); return d.getMonth() === monthNum && d.getFullYear() === yearNum; }).reduce((sum, s) => sum + s.actualTime, 0)),
                    focusSessions: sessions.filter(s => { if (!s.completed) return false; const d = new Date(s.createdAt); return d.getMonth() === monthNum && d.getFullYear() === yearNum; }).length
                });
            }
        }
        return result;
    }, [timeframe, problems, sessions]);

    const sortedSubjects = useMemo(() => {
        if (!data || !data.subjectBreakdown) return [];
        return [...data.subjectBreakdown].map(sub => {
            const subProblemsSolved = problems.filter(p => p.subject === sub.id && p.status === 'solved').length;
            const subSessions = sessions.filter(s => s.completed && s.subject?._id === sub.id);
            const avgFocus = subSessions.length > 0 ? Math.round(subSessions.reduce((sum, s) => sum + s.actualTime, 0) / subSessions.length) : 0;
            return { ...sub, problemsSolvedCount: subProblemsSolved, avgFocusSession: avgFocus };
        }).sort((a, b) => (b.progress || 0) - (a.progress || 0));
    }, [data, problems, sessions]);

    const difficultyData = useMemo(() => {
        if (!data || !data.problemStats) return [];
        return [
            { name: 'Easy', value: data.problemStats.difficulty.Easy || 0, color: '#10B981' },
            { name: 'Medium', value: data.problemStats.difficulty.Medium || 0, color: '#F59E0B' },
            { name: 'Hard', value: data.problemStats.difficulty.Hard || 0, color: '#EF4444' }
        ].filter(d => d.value > 0);
    }, [data]);

    const learningScore = useMemo(() => {
        if (!data || problems.length === 0) return 0;
        const last30Days = heatmapData.slice(-30);
        const activeDays = last30Days.filter(day => day.problemsSolved > 0 || day.studyTime > 0).length;
        const consistencyScore = Math.min(100, (activeDays / 20) * 100);
        const solvedLast30 = last30Days.reduce((sum, day) => sum + day.problemsSolved, 0);
        const practiceScore = Math.min(100, (solvedLast30 / 15) * 100);
        const focusMinsLast30 = last30Days.reduce((sum, day) => sum + day.studyTime, 0);
        const studyTimeScore = Math.min(100, ((focusMinsLast30 / 60) / 20) * 100);
        const completionScore = data.subjects.progressPercentage || 0;
        const sessionsLast30 = last30Days.reduce((sum, day) => sum + day.sessionsCount, 0);
        const focusBlocksScore = Math.min(100, (sessionsLast30 / 20) * 100);
        return Math.min(100, Math.max(0, Math.round(consistencyScore * 0.3 + practiceScore * 0.25 + studyTimeScore * 0.15 + completionScore * 0.2 + focusBlocksScore * 0.1)));
    }, [data, problems, heatmapData]);

    const learningInsights = useMemo(() => {
        if (!data || problems.length === 0) return [];
        const insights = [];
        if (statsSummary?.solvedTrend > 0) insights.push({ type: 'positive', text: `You solved ${statsSummary.solvedTrend}% more coding problems this week vs last week. Excellent consistency!` });
        const dayFocusTimes = Array(7).fill(0);
        sessions.filter(s => s.completed).forEach(s => { dayFocusTimes[new Date(s.createdAt).getDay()] += s.actualTime; });
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const maxDayIndex = dayFocusTimes.indexOf(Math.max(...dayFocusTimes));
        if (dayFocusTimes[maxDayIndex] > 0) insights.push({ type: 'schedule', text: `${days[maxDayIndex]} is your strongest study day. You log the highest focused minutes on this day.` });
        const inProgressSubjects = sortedSubjects.filter(s => s.progress > 0 && s.progress < 100);
        if (inProgressSubjects.length > 0) insights.push({ type: 'subject', text: `${inProgressSubjects[0].name} is your highest progressing subject. You've completed ${inProgressSubjects[0].progress}% of its syllabus.` });
        if (statsSummary?.focusTrend > 0) insights.push({ type: 'time', text: `Your focus block study duration increased by ${statsSummary.focusTrend}% compared to last week.` });
        if (insights.length === 0) insights.push({ type: 'tip', text: "Your productivity analytics insights will appear here as you log study sessions and solve queue items." });
        return insights.slice(0, 3);
    }, [data, problems, sortedSubjects, statsSummary, sessions]);

    const achievements = useMemo(() => {
        if (!data || !data.streaks) return [];
        const solvedCount = problems.filter(p => p.status === 'solved').length;
        const totalFocusSessions = sessions.filter(s => s.completed).length;
        return [
            { id: 'streak-7', title: '7 Day Streak', desc: 'Maintain consistency for 7 days in a row.', icon: '🔥', unlocked: data.streaks.longestStreak >= 7, meta: `${Math.min(7, data.streaks.longestStreak)}/7 days` },
            { id: 'streak-30', title: '30 Day Streak', desc: 'A solid month of continuous learning.', icon: '👑', unlocked: data.streaks.longestStreak >= 30, meta: `${Math.min(30, data.streaks.longestStreak)}/30 days` },
            { id: 'problems-10', title: 'Practice Initiate', desc: 'Solve 10 coding problems in the practice queue.', icon: '💻', unlocked: solvedCount >= 10, meta: `${solvedCount}/10 solved` },
            { id: 'problems-50', title: 'Algorithm Expert', desc: 'Solve 50 coding problems overall.', icon: '🚀', unlocked: solvedCount >= 50, meta: `${solvedCount}/50 solved` },
            { id: 'subject-master', title: 'Subject Master', desc: 'Reach 100% completion on at least one subject.', icon: '🎓', unlocked: subjectsList.some(s => s.progressPercentage === 100), meta: subjectsList.some(s => s.progressPercentage === 100) ? 'Completed!' : '0/1 subjects' },
            { id: 'focus-champion', title: 'Focus Champion', desc: 'Complete 10 focused study blocks.', icon: '⏱️', unlocked: totalFocusSessions >= 10, meta: `${totalFocusSessions}/10 blocks` }
        ];
    }, [data, problems, sessions, subjectsList]);

    const recentActivity = useMemo(() => {
        const feed = [];
        problems.filter(p => p.status === 'solved' && p.solvedAt).forEach(p => feed.push({ id: p._id + '-solved', date: new Date(p.solvedAt), type: 'problem', title: `Solved ${p.title}`, desc: `Platform: ${p.platform} (${p.difficulty} difficulty)` }));
        sessions.filter(s => s.completed).forEach(s => feed.push({ id: s._id + '-session', date: new Date(s.createdAt), type: 'focus', title: `Focus Block Completed`, desc: `Subject: ${s.subject?.name || 'General'} (${s.actualTime} minutes log)` }));
        notes.forEach(n => {
            if (n.createdAt) feed.push({ id: n._id + '-created', date: new Date(n.createdAt), type: 'note-create', title: `Note Created`, desc: `Captured "${n.title}" check card` });
            if (n.isReviewed && n.updatedAt) feed.push({ id: n._id + '-reviewed', date: new Date(n.updatedAt), type: 'note-review', title: `Note Reviewed`, desc: `Marked "${n.title}" revision complete` });
        });
        return feed.sort((a, b) => b.date - a.date).slice(0, 6);
    }, [problems, sessions, notes]);

    if (loading) {
        return (
            <div className="w-full px-6 lg:px-8 py-8 font-sans bg-white min-h-screen space-y-8 animate-pulse">
                <div className="flex justify-between items-center pb-5 border-b border-zinc-200/50">
                    <div className="space-y-2"><div className="h-6 w-32 bg-zinc-100 rounded"></div><div className="h-4 w-48 bg-zinc-50 rounded"></div></div>
                    <div className="h-10 w-24 bg-zinc-100 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-zinc-50 border border-zinc-200/40 rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8 h-80 bg-zinc-50 border border-zinc-200/40 rounded-2xl"></div>
                    <div className="col-span-12 lg:col-span-4 h-80 bg-zinc-50 border border-zinc-200/40 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!data || !statsSummary) {
        return (
            <div className="w-full px-6 py-8 text-center font-sans text-sm text-zinc-500">
                <Info className="mx-auto mb-3 text-zinc-400" size={32} />
                Failed to load analytics dashboard. Please check that the server is active.
            </div>
        );
    }

    return (
        <div className="w-full px-6 lg:px-8 py-8 font-sans text-zinc-850 bg-white min-h-screen">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-200/50">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                        <TrendingUp size={22} className="text-zinc-800" /> Dashboard
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Analytics Overview — Track your learning journey with insights across coding, subjects, and focus sessions.
                    </p>
                </div>
                <div className="flex items-center gap-3.5">
                    <div className="flex bg-zinc-100 p-0.8 border border-zinc-200/30 rounded-lg select-none">
                        {['week', 'month', 'year'].map(t => (
                            <button key={t} onClick={() => setTimeframe(t)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${timeframe === t ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="hidden md:block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-2 border border-zinc-200/60 rounded-lg">
                        UPDATED: {new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className={`${cardShell} group relative overflow-hidden p-5 bg-gradient-to-br from-white via-zinc-50/80 to-zinc-100/50`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Problems Solved</span>
                        <div className="bg-zinc-100 text-zinc-700 rounded-xl p-2 border border-zinc-200/70"><Code size={16} /></div>
                    </div>
                    <div className="relative text-2xl font-extrabold text-zinc-900 mt-3">{statsSummary.totalSolved}</div>
                    <div className="relative flex items-center gap-1 mt-2 text-[10px] font-semibold">
                        <span className={statsSummary.solvedTrend >= 0 ? "text-emerald-600" : "text-rose-600"}>{statsSummary.solvedTrend >= 0 ? '↑' : '↓'} {Math.abs(statsSummary.solvedTrend)}%</span>
                        <span className="text-zinc-400">vs last week</span>
                    </div>
                </div>
                <div className={`${cardShell} group relative overflow-hidden p-5 bg-gradient-to-br from-white via-zinc-50/80 to-zinc-100/50`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Topics Completed</span>
                        <div className="bg-zinc-100 text-zinc-700 rounded-xl p-2 border border-zinc-200/70"><Brain size={16} /></div>
                    </div>
                    <div className="relative text-2xl font-extrabold text-zinc-900 mt-3">{statsSummary.completedTopics}</div>
                    <div className="relative flex items-center gap-1 mt-2 text-[10px] font-semibold">
                        <span className="text-emerald-600">+{statsSummary.solvedToday} today</span>
                        <span className="text-zinc-400">• solved practice</span>
                    </div>
                </div>
                <div className={`${cardShell} group relative overflow-hidden p-5 bg-gradient-to-br from-white via-zinc-50/80 to-zinc-100/50`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Completion Rate</span>
                        <div className="bg-zinc-100 text-zinc-700 rounded-xl p-2 border border-zinc-200/70"><CheckCircle size={16} /></div>
                    </div>
                    <div className="relative text-2xl font-extrabold text-zinc-900 mt-3">{statsSummary.completionRate}%</div>
                    <div className="relative flex items-center gap-1 mt-2 text-[10px] font-semibold">
                        <span className="text-zinc-500">Solved vs total queue items</span>
                    </div>
                </div>
                <div className={`${cardShell} group relative overflow-hidden p-5 bg-gradient-to-br from-white via-zinc-50/80 to-zinc-100/50`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Focus Time</span>
                        <div className="bg-zinc-100 text-zinc-700 rounded-xl p-2 border border-zinc-200/70"><Clock size={16} /></div>
                    </div>
                    <div className="relative text-2xl font-extrabold text-zinc-900 mt-3">{statsSummary.focusHours}h</div>
                    <div className="relative flex items-center gap-1 mt-2 text-[10px] font-semibold">
                        <span className={statsSummary.focusTrend >= 0 ? "text-emerald-600" : "text-rose-600"}>{statsSummary.focusTrend >= 0 ? '↑' : '↓'} {Math.abs(statsSummary.focusTrend)}%</span>
                        <span className="text-zinc-400">vs last week</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">

                <div className={`col-span-12 lg:col-span-8 ${sectionShell} p-6`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
                        <div>
                            <h3 className="font-bold text-[11px] text-zinc-400 uppercase tracking-[0.24em]">Study Performance Trends</h3>
                            <p className="text-[10px] text-zinc-500 mt-1">Problems solved and study duration over selected timeframe.</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-zinc-950 rounded-sm"></span><span className="text-zinc-650">Solve Count</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-zinc-200 rounded-sm"></span><span className="text-zinc-650">Minutes Studied</span></div>
                        </div>
                    </div>
                    <div className="h-72 sm:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis yAxisId="left" orientation="left" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#d4d4d8', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5', opacity: 0.5 }} />
                                <Bar yAxisId="left" dataKey="problemsSolved" fill="#18181b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Bar yAxisId="right" dataKey="studyTime" fill="#e4e4e7" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`col-span-12 lg:col-span-4 ${cardShell} p-5 flex flex-col bg-gradient-to-br from-white via-zinc-50/80 to-zinc-100/50`}>
                    <h4 className="font-bold text-[11px] text-zinc-900 uppercase tracking-[0.24em] select-none flex items-center gap-1.5 w-full pb-2 border-b border-zinc-100 flex-shrink-0">
                        <Activity size={14} className="text-zinc-800 animate-pulse" /> Learning Score
                    </h4>
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-4">
                        <div className="relative w-40 h-40 flex items-center justify-center select-none">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
                                <circle cx="72" cy="72" r="58" className="text-zinc-100 stroke-current" strokeWidth="9" fill="none" />
                                <circle cx="72" cy="72" r="58" className="text-zinc-950 stroke-current transition-all duration-1000 ease-out" strokeWidth="9" fill="none"
                                    strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * learningScore) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                                <span className="text-4xl font-black tracking-tight text-zinc-900 leading-none">{learningScore}</span>
                                <span className="text-[10px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest">Level Score</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 text-center leading-relaxed max-w-[200px]">
                            Weighted from consistency, practice frequency, focus blocks, and subject completion—kept live as your activity changes.
                        </p>
                    </div>
                </div>

                <div className={`col-span-12 lg:col-span-6 ${cardShell} p-5 space-y-4`}>
                    <h3 className="font-bold text-[11px] text-zinc-900 uppercase tracking-[0.24em] select-none flex items-center gap-1.5 pb-2 border-b border-zinc-150/40">
                        <BookOpen size={14} className="text-zinc-400" /> Subject Analytics
                    </h3>
                    {sortedSubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-xs text-zinc-500 font-medium select-none">
                            <BookOpen size={18} className="text-zinc-300" />No subjects logged yet.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                            {sortedSubjects.map(sub => (
                                <div key={sub.name} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 transition-all duration-200 hover:border-zinc-200 hover:bg-white">
                                    <div className="flex justify-between items-center text-xs font-semibold text-zinc-800 gap-3">
                                        <span className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-base select-none">{sub.icon || '📚'}</span>
                                            <span className="truncate">{sub.name}</span>
                                        </span>
                                        <span>{sub.progress || 0}% Complete</span>
                                    </div>
                                    <div className="mt-2.5 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${sub.progress || 0}%`, backgroundColor: sub.color || '#18181b' }}></div>
                                    </div>
                                    <div className="mt-2 flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                                        <span>{sub.problemsSolvedCount} coding solved</span>
                                        <span>{sub.avgFocusSession}m avg session</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`col-span-12 lg:col-span-6 ${cardShell} p-5 flex flex-col`}>
                    <h3 className="font-bold text-xs text-zinc-900 uppercase tracking-wider select-none flex items-center gap-1.5 pb-2 border-b border-zinc-150/40">
                        <Code size={14} className="text-zinc-400" /> Difficulty Breakdown
                    </h3>
                    {difficultyData.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center text-xs text-zinc-500 font-medium select-none mt-4">
                            <Code size={22} className="text-zinc-300" />Complete your first coding problem to unlock difficulty analytics.
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center items-center py-4">
                            <div className="h-44 w-full relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {difficultyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip content={<DifficultyTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute text-center select-none font-sans">
                                    <p className="text-2xl font-black text-zinc-900 leading-none">{difficultyData.reduce((sum, d) => sum + d.value, 0)}</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Solved</p>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 text-[10px] font-bold mt-4 w-full border-t border-zinc-100 pt-3">
                                {difficultyData.map(d => (
                                    <div key={d.name} className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                                        <span className="text-zinc-650">{d.name} ({d.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`col-span-12 lg:col-span-8 ${cardShell} p-5 space-y-4`}>
                    <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-100">
                        <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={14} className="text-zinc-650" /> Consistency Map
                        </h4>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Last 16 Weeks</span>
                    </div>
                    <div className="overflow-x-auto pb-1">
                        <div className="flex gap-1">
                            {heatmapWeeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-1">
                                    {week.map((day, dIdx) => {
                                        const levelColors = ['bg-zinc-100 border-zinc-200/30 hover:border-zinc-400','bg-zinc-300 border-zinc-350 hover:bg-zinc-400','bg-zinc-600 border-zinc-650 hover:bg-zinc-700','bg-zinc-800 border-zinc-850 hover:bg-zinc-900','bg-zinc-950 border-zinc-950 hover:scale-105'];
                                        const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                                        return (
                                            <button key={dIdx} onClick={() => setSelectedDate(day.date)}
                                                onMouseEnter={() => setHeatmapHoverData(day)} onMouseLeave={() => setHeatmapHoverData(null)}
                                                aria-label={`View activity for ${day.date.toDateString()}`}
                                                className={`w-3.5 h-3.5 rounded border transition-all duration-150 cursor-pointer hover:-translate-y-[1px] ${isSelected ? 'ring-2 ring-zinc-950 scale-105 border-transparent z-10 shadow-sm' : levelColors[day.level]}`}
                                                title={day.date.toDateString()} />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-10 flex items-center justify-center text-[10px] text-zinc-400 border-t border-zinc-50 pt-2 font-semibold">
                        {heatmapHoverData ? (
                            <div className="text-zinc-700 animate-fade-in flex gap-2 select-none">
                                <span>{heatmapHoverData.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}:</span>
                                <strong>{heatmapHoverData.problemsSolved} problems</strong>
                                <span>•</span>
                                <strong>{heatmapHoverData.studyTime} mins focus</strong>
                            </div>
                        ) : (
                            <span className="select-none">Hover cells for daily stats • Click to select date</span>
                        )}
                    </div>
                </div>

                <div className={`col-span-12 lg:col-span-4 ${cardShell} p-5 space-y-4`}>
                    <h4 className="font-bold text-[11px] text-zinc-900 uppercase tracking-[0.24em] select-none flex items-center gap-1.5">
                        <Sparkles size={14} className="text-zinc-800" /> Learning Insights
                    </h4>
                    <div className="space-y-3">
                        {learningInsights.map((insight, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-zinc-50 to-white border border-zinc-150/70 p-3 rounded-xl flex gap-3 text-xs leading-relaxed text-zinc-650 font-medium transition-all duration-200 hover:border-zinc-200 hover:shadow-sm">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-white text-[10px] font-black select-none flex-shrink-0">{idx + 1}</div>
                                <p>{insight.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-6">
                    <ActivityCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </div>

                <div className="col-span-12 lg:col-span-6 bg-[#111111] text-zinc-100 rounded-2xl p-6 border border-zinc-800/80 shadow-2xl flex flex-col justify-between min-h-[460px]">
                    <div className="flex justify-between items-baseline pb-3.5 border-b border-zinc-800/70">
                        <h4 className="font-bold text-xs text-zinc-100 uppercase tracking-wider select-none">Daily Summary</h4>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                        <div className="bg-[#161616] p-3.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700/60 transition-colors">
                            <p className="text-xl font-extrabold text-zinc-100 tracking-tight">{dailySummary.problemsSolved}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Problems Solved</p>
                        </div>
                        <div className="bg-[#161616] p-3.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700/60 transition-colors">
                            <p className="text-xl font-extrabold text-zinc-100 tracking-tight">{dailySummary.studyTime}m</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Study Time</p>
                        </div>
                        <div className="bg-[#161616] p-3.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700/60 transition-colors">
                            <p className="text-xl font-extrabold text-zinc-100 tracking-tight">{dailySummary.sessionsCount}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Focus Sessions</p>
                        </div>
                        <div className="bg-[#161616] p-3.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700/60 transition-colors">
                            <p className="text-xl font-extrabold text-zinc-100 tracking-tight">{dailySummary.notesReviewed}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Notes Reviewed</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                            <span className="tracking-wide uppercase">Today's Progress</span>
                            <span className="text-zinc-200">{todayStats.todayProgressPercentage}%</span>
                        </div>
                        <div className="w-full bg-zinc-800/50 rounded-full h-2 overflow-hidden border border-zinc-800/20">
                            <div
                                className="h-full rounded-full bg-[#4F7DF3] transition-all duration-500 ease-out"
                                style={{ width: `${todayStats.todayProgressPercentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-[#161616]/45 border border-zinc-800/40 p-3 rounded-xl text-xs mt-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estimated Remaining</span>
                        </div>
                        <span className="font-extrabold text-zinc-200">{formatTime(todayStats.remainingStudyTime)}</span>
                    </div>

                    <div className="bg-[#161616]/30 border border-zinc-800/30 rounded-xl p-3 text-xs leading-relaxed text-zinc-300 font-medium mt-3 flex items-start gap-2.5">
                        <span className="text-sm select-none shrink-0">💡</span>
                        <p className="text-[11px] text-zinc-300">{getDailyInsight()}</p>
                    </div>
                </div>

                <div className={`col-span-12 lg:col-span-6 ${cardShell} p-5 space-y-4`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between select-none pb-2 border-b border-zinc-100">
                        <h4 className="font-bold text-[11px] text-zinc-900 uppercase tracking-[0.24em] flex items-center gap-1.5">
                            <Award size={14} className="text-zinc-650" /> Accomplishments
                        </h4>
                        <span className="text-[9px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">
                            {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {achievements.map((ach) => (
                            <div key={ach.id}
                                className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all select-none hover:-translate-y-0.5 ${ach.unlocked ? 'bg-gradient-to-b from-zinc-50 to-white border-zinc-200 shadow-sm' : 'bg-zinc-50/20 border-zinc-150/40 opacity-40 grayscale'}`}
                                title={`${ach.title}: ${ach.desc}`}>
                                <span className="text-2xl mb-1.5">{ach.icon}</span>
                                <h5 className="text-[9px] font-bold text-zinc-900 truncate max-w-[86px] leading-tight">{ach.title}</h5>
                                <span className="text-[8px] font-semibold text-zinc-400 mt-1 uppercase tracking-wide">{ach.meta}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`col-span-12 lg:col-span-6 ${cardShell} p-5 space-y-4`}>
                    <h4 className="font-bold text-[11px] text-zinc-900 uppercase tracking-[0.24em] select-none flex items-center gap-1.5">
                        <Activity size={14} className="text-zinc-650" /> Activity Timeline
                    </h4>
                    {recentActivity.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center text-xs text-zinc-500 font-medium select-none">
                            <Activity size={18} className="text-zinc-300" />No recent activity logged yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((act) => (
                                <div key={act.id} className="group flex gap-3 text-xs leading-relaxed border-l-2 border-zinc-100 pl-3.5 relative transition-all duration-200 hover:border-zinc-300">
                                    <div className="absolute w-2 h-2 rounded-full bg-zinc-900 left-[-5px] top-1.5 group-hover:scale-125 transition-transform"></div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-zinc-900 tracking-tight">{act.title}</p>
                                        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-[0.18em] mt-0.5">{act.desc}</p>
                                        <p className="text-[9px] text-zinc-400 font-medium mt-1">
                                            {act.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })} at {act.date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
            <div className="bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800 shadow-xl text-xs font-sans space-y-2.5 max-w-[240px]">
                <p className="font-bold text-zinc-300 border-b border-zinc-800 pb-1.5">{dataPoint.dateLabel || label}</p>
                <div className="space-y-1">
                    <p className="flex justify-between gap-4"><span className="text-zinc-500">Solved:</span><span className="font-bold text-zinc-100">{dataPoint.problemsSolved} problems</span></p>
                    <p className="flex justify-between gap-4"><span className="text-zinc-500">Study Duration:</span><span className="font-bold text-zinc-100">{dataPoint.studyTime} mins</span></p>
                    <p className="flex justify-between gap-4"><span className="text-zinc-500">Focus Sessions:</span><span className="font-bold text-zinc-100">{dataPoint.focusSessions} blocks</span></p>
                </div>
            </div>
        );
    }
    return null;
};

const DifficultyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-zinc-950 text-white p-3 rounded-lg border border-zinc-800 shadow-xl text-xs font-sans">
                <p className="font-bold text-zinc-300">{data.name}</p>
                <p className="mt-1 text-zinc-100">Solved count: <strong>{data.value} problems</strong></p>
            </div>
        );
    }
    return null;
};

export default Dashboard;
