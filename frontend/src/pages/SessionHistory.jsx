import { useState, useEffect, useContext } from 'react';
import { Clock, Calendar, BarChart2, BookOpen, Filter } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import sessionService from '../context/sessionService';

const SessionHistory = () => {
    const { user } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState({ totalSessions: 0, totalTime: 0, avgSessionTime: 0 });
    const [loading, setLoading] = useState(true);
    const [filterDays, setFilterDays] = useState('30'); // '7', '30', 'all'

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [sessionsData, statsData] = await Promise.all([
                    sessionService.getSessions(filterDays, 50, user.token),
                    sessionService.getStats(user.token)
                ]);
                setSessions(sessionsData);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [filterDays, user]);

    const formatDuration = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: 'numeric'
        }).format(date);
    };

    return (
        <div className="w-full px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Study History</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Time</p>
                        <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalTime)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Avg Session</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avgSessionTime} min</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Recent Sessions</h2>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {['7', '30', 'all'].map((day) => (
                        <button
                            key={day}
                            onClick={() => setFilterDays(day)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filterDays === day
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {day === 'all' ? 'All Time' : `Last ${day} Days`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No sessions found</h3>
                        <p className="text-gray-500">Start studying to build your history!</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div key={session._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <div className={`w-3 h-3 rounded-full ${session.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {session.subject?.name || 'Unknown Subject'}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md capitalize">
                                            {session.sessionType || 'Pomodoro'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {session.topic?.name || 'No specific topic'}
                                    </p>
                                    {session.notes && (
                                        <p className="text-sm text-gray-400 italic">"{session.notes}"</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500 pl-7 md:pl-0">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    {formatDate(session.startTime)}
                                </div>
                                <div className="flex items-center gap-1.5 font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                                    <Clock size={14} />
                                    {session.actualTime} min
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SessionHistory;
