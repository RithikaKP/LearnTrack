import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import dashboardService from '../context/dashboardService';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
    Clock, BookOpen, CheckCircle, Flame, RefreshCw,
    Activity, Code, Brain
} from 'lucide-react';

import ActivityCalendar from '../components/dashboard/ActivityCalendar';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Calendar State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dailyActivity, setDailyActivity] = useState([]);
    const [loadingDaily, setLoadingDaily] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const stats = await dashboardService.getStats();
            setData(stats);
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
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

    if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500"></div></div>;
    if (!data) return <div className="p-10 text-center">Failed to load data</div>;

    const { subjects, timeStats, streaks, weeklyStudyPattern, pomodoroStats, problemStats } = data;

    // Chart Colors
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const WEEKLY_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444']; // Distinct colors for each day
    const DIFFICULTY_COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Easy, Medium, Hard matches Green, Yellow, Red

    // Coding Difficulty Data
    const difficultyData = [
        { name: 'Easy', value: problemStats.difficulty.Easy },
        { name: 'Medium', value: problemStats.difficulty.Medium },
        { name: 'Hard', value: problemStats.difficulty.Hard },
    ].filter(d => d.value > 0);

    return (
        <div className="w-full px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
                    <p className="text-gray-500 text-sm">Here's your productivity overview.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={BookOpen} color="text-blue-600" bg="bg-blue-50"
                    label="Topics Completed"
                    value={`${subjects.completedTopics} / ${subjects.totalTopics}`}
                    subvalue={`${subjects.progressPercentage}% Overall`}
                />
                <StatCard
                    icon={Clock} color="text-purple-600" bg="bg-purple-50"
                    label="Study Time (30d)"
                    value={`${Math.floor(timeStats.totalTimeSpent / 60)}h ${timeStats.totalTimeSpent % 60}m`}
                    subvalue={`${timeStats.averageDailyTime} min/day avg`}
                />
                <StatCard
                    icon={Flame} color="text-orange-500" bg="bg-orange-50"
                    label="Current Streak"
                    value={`${streaks.currentStreak} Days`}
                    subvalue={`Best: ${streaks.longestStreak} Days`}
                />
                <StatCard
                    icon={Code} color="text-green-600" bg="bg-green-50"
                    label="Problems Solved"
                    value={problemStats.solved}
                    subvalue={`${problemStats.solveRate}% Solve Rate`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Weekly Activity Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-indigo-600" /> Weekly Activity
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyStudyPattern}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6', opacity: 0.8, radius: 4 }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: '#1F2937', fontWeight: 600 }}
                                />
                                <Bar
                                    dataKey="minutes"
                                    radius={[8, 8, 8, 8]}
                                    barSize={32}
                                    animationDuration={1500}
                                    background={{ fill: '#F3F4F6', radius: [8, 8, 8, 8] }}
                                >
                                    {weeklyStudyPattern && weeklyStudyPattern.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={WEEKLY_COLORS[index % WEEKLY_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pomodoro & Focus Widget */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="mb-4 relative">
                        <Brain size={48} className="text-indigo-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150" />
                        <div className="relative z-10 text-4xl font-bold text-gray-900">{pomodoroStats.totalPomodoros}</div>
                    </div>
                    <p className="text-gray-500 font-medium mb-1">Pomodoros Completed</p>
                    <p className="text-xs text-indigo-500 font-semibold bg-indigo-50 px-2 py-1 rounded-md">
                        {Math.round(pomodoroStats.totalPomodoros * 25 / 60)} Hours of Focus
                    </p>

                    <div className="w-full mt-8 pt-6 border-t border-gray-50 text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Most Focused Subject</p>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800 text-lg">{timeStats.mostStudiedSubject}</span>
                            <span className="text-sm text-gray-500">Top Priority</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Activity Calendar Section */}
                <div className="space-y-6">
                    {/* Calendar */}
                    <div>
                        <ActivityCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                    </div>


                </div>

                {/* Coding Stats */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-800 mb-6 flex justify-between items-center">
                        <span>Problem Solving</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {problemStats.total} Total
                        </span>
                    </h3>

                    <div className="flex items-center">
                        <div className="h-48 w-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={difficultyData}
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {difficultyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex-1 space-y-3 pl-4">
                            <LegendItem color="bg-green-500" label="Easy" value={problemStats.difficulty.Easy} total={problemStats.total} />
                            <LegendItem color="bg-yellow-500" label="Medium" value={problemStats.difficulty.Medium} total={problemStats.total} />
                            <LegendItem color="bg-red-500" label="Hard" value={problemStats.difficulty.Hard} total={problemStats.total} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Details for Selected Date */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                    <span>Activity for {selectedDate.toLocaleDateString()}</span>
                    {dailyActivity.length > 0 && (
                        <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                            {dailyActivity.length} Subjects Active
                        </span>
                    )}
                </h3>

                {loadingDaily ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500"></div></div>
                ) : dailyActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-100">
                        <p>No study activity recorded for this day.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dailyActivity.map((activity, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-xl">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{activity.subjectIcon}</span>
                                        <div>
                                            <span className="font-bold text-gray-700 block leading-tight">{activity.subjectName}</span>
                                            {/* Progress Text */}
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {activity.topicsCompleted.length}/{activity.dailyTarget} Topics
                                                </span>
                                                {activity.topicsCompleted.length >= activity.dailyTarget && (
                                                    <CheckCircle size={12} className="text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-indigo-600 font-bold bg-white px-2 py-1 rounded-md text-xs shadow-sm">
                                        {activity.timeSpent}m
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full ${activity.topicsCompleted.length >= activity.dailyTarget
                                            ? 'bg-green-500'
                                            : 'bg-indigo-500'
                                            }`}
                                        style={{ width: `${Math.min((activity.topicsCompleted.length / (activity.dailyTarget || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>

                                {activity.topicsCompleted.length > 0 ? (
                                    <div className="pl-3 border-l-2" style={{ borderColor: activity.subjectColor }}>
                                        {activity.topicsCompleted.map((topic, tIdx) => (
                                            <div key={tIdx} className="text-sm text-gray-600 flex items-center gap-1.5 mb-1 last:mb-0">
                                                <CheckCircle size={12} className="text-green-500" /> {topic}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic pl-1">No topics completed yet.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, color, bg, label, value, subvalue }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color} mb-3`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1 opacity-70">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subvalue && <p className="text-xs text-gray-400 mt-1">{subvalue}</p>}
        </div>
    </div>
);

const LegendItem = ({ color, label, value, total }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            <span className="text-gray-600">{label}</span>
        </div>
        <div className="font-bold text-gray-800">{value}</div>
    </div>
);

export default Dashboard;
